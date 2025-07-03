from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from PIL import Image
import torch
from torchvision import transforms, models
import torch.nn as nn
import torch.nn.functional as F
import numpy as np
import cv2
import os
from dotenv import load_dotenv
load_dotenv()
import io
import matplotlib.pyplot as plt
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware

# Initialize FastAPI app
app = FastAPI()

# Add CORS middleware - configure for production
allowed_origins = os.environ.get("ALLOWED_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# Mapping
lesion_type_dict = {
    'nv': 'Melanocytic nevi',
    'mel': 'Melanoma',
    'bkl': 'Benign keratosis-like lesions',
    'bcc': 'Basal cell carcinoma',
    'akiec': 'Actinic keratoses',
    'vasc': 'Vascular lesions',
    'df': 'Dermatofibroma'
}
idx_to_label = ['akiec', 'bcc', 'bkl', 'df', 'nv', 'vasc', 'mel']

# Define model loader
def set_parameter_requires_grad(model, feature_extracting):
    if feature_extracting:
        for param in model.parameters():
            param.requires_grad = False

def initialize_model(model_name, num_classes, feature_extract, use_pretrained=True):
    model_ft = None
    input_size = 0
    if model_name == "mobilenet":
        model_ft = models.mobilenet_v2(weights=models.MobileNet_V2_Weights.DEFAULT if use_pretrained else None)
        set_parameter_requires_grad(model_ft, feature_extract)
        input_size = 224
        model_ft.classifier[1] = nn.Linear(model_ft.last_channel, num_classes)
    elif model_name == "resnet50":
        model_ft = models.resnet50(weights=models.ResNet50_Weights.DEFAULT if use_pretrained else None)
        set_parameter_requires_grad(model_ft, feature_extract)
        input_size = 224
        model_ft.fc = nn.Linear(model_ft.fc.in_features, num_classes)
    else:
        raise ValueError("Invalid model name")
    return model_ft, input_size

# Init model
model_name = "resnet50"  # Change to "mobilenet" or "resnet50" as needed
num_classes = 7
feature_extract = False
model_ft, input_size = initialize_model(model_name, num_classes, feature_extract, use_pretrained=True)

# Device
USE_GPU = True
device = torch.device('cuda:0' if USE_GPU and torch.cuda.is_available() else 'cpu')
model = model_ft.to(device)

# Load trained model
model = torch.load('skin_cancer_model (1).pth', map_location=device, weights_only=False)
model.eval()

# Image preprocessing
norm_mean = [0.7630392, 0.5456477, 0.57004845]
norm_std = [0.1409286, 0.15261266, 0.16997074]
test_transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(norm_mean, norm_std)
])

# Grad-CAM hooks
gradients = []
activations = []

# Set target layer for Grad-CAM based on model type
if hasattr(model, 'features'):
    target_layer = model.features[-1]  # MobileNetV2
elif hasattr(model, 'layer4'):
    target_layer = model.layer4        # ResNet50
else:
    raise AttributeError('Model does not have a supported target layer for Grad-CAM')

def forward_hook(module, input, output):
    activations.append(output)
def backward_hook(module, grad_input, grad_output):
    gradients.append(grad_output[0])

forward_handle = target_layer.register_forward_hook(forward_hook)
backward_handle = target_layer.register_backward_hook(backward_hook)


# Combined endpoint for prediction and gradcam
import base64
import tempfile
import requests

@app.post("/analyze/")
async def analyze(file: UploadFile = File(...)):
    try:
        # Load image
        image = Image.open(io.BytesIO(await file.read())).convert('RGB')
        input_tensor = test_transform(image).unsqueeze(0).to(device)

        # Inference (prediction)
        outputs = model(input_tensor)
        probabilities = F.softmax(outputs, dim=1)
        confidence, predicted = torch.max(probabilities, 1)

        # Prepare prediction response
        pred_response = {
            "predicted_class": idx_to_label[predicted.item()],
            "lesion_type": lesion_type_dict[idx_to_label[predicted.item()]],
            "confidence_scores": {
                lesion_type_dict[idx_to_label[idx]]: prob.item() * 100
                for idx, prob in enumerate(probabilities[0])
            }
        }

        # Grad-CAM
        activations.clear()
        gradients.clear()
        model.zero_grad()
        outputs = model(input_tensor)
        predicted = torch.argmax(outputs, 1)
        class_score = outputs[0, predicted.item()]
        class_score.backward()

        activation = activations[0].squeeze().detach()
        gradient = gradients[0].squeeze().detach()
        weights = gradient.mean(dim=(1, 2))
        cam = (weights[:, None, None] * activation).sum(dim=0)
        cam = F.relu(cam)
        cam -= cam.min()
        cam /= cam.max()
        cam = cam.cpu().numpy()

        heatmap = cv2.resize(cam, (224, 224))
        heatmap = np.uint8(255 * heatmap)
        heatmap = cv2.applyColorMap(heatmap, cv2.COLORMAP_JET)

        orig_img = image.resize((224, 224))
        orig_np = np.array(orig_img)
        if orig_np.ndim == 2:
            orig_np = cv2.cvtColor(orig_np, cv2.COLOR_GRAY2RGB)
        overlay = cv2.addWeighted(orig_np, 0.5, heatmap, 0.5, 0)
        _, buffer = cv2.imencode('.jpg', overlay)
        gradcam_b64 = base64.b64encode(buffer.tobytes()).decode('utf-8')

        # --- Upload original image to Node backend and get image URL ---
        NODE_BACKEND_URL = os.environ.get("NODE_BACKEND_URL", "http://localhost:4000")
        image_upload_url = f"{NODE_BACKEND_URL}/upload-image"
        image_url = None
        try:
            print(f"[INFO] Uploading original image to {image_upload_url} ...")
            with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmpimg:
                image.save(tmpimg, format="JPEG")
                tmpimg_path = tmpimg.name
            with open(tmpimg_path, "rb") as f:
                files = {"file": (file.filename, f, "image/jpeg")}
                img_res = requests.post(image_upload_url, files=files)
                print(f"[INFO] Image upload response status: {img_res.status_code}")
                print(f"[INFO] Image upload response: {img_res.text}")
                img_res.raise_for_status()
                image_url = img_res.json().get("url")
            os.remove(tmpimg_path)
        except Exception as e:
            print(f"[ERROR] Failed to upload original image: {e}")
            image_url = None

        # --- Store prediction in Node backend and get prediction_id ---
        node_backend_url = f"{NODE_BACKEND_URL}/store-prediction"
        prediction_payload = {
            "user_id": "anonymous",  # Replace with actual user ID if available
            "image_uri": image_url or "",  # Use uploaded image URL
            "filename": file.filename,
            "predicted_class": pred_response["predicted_class"],
            "confidence_scores": pred_response["confidence_scores"],
            "model_version": "resnet50",
            "gradcam_uri": ""  # Will be updated after upload
        }
        prediction_id = None
        try:
            print(f"[INFO] Sending prediction to {node_backend_url} ...")
            pred_res = requests.post(node_backend_url, json=prediction_payload)
            print(f"[INFO] Prediction response status: {pred_res.status_code}")
            pred_res.raise_for_status()
            prediction_id = pred_res.json().get("prediction_id")
            print(f"[INFO] Received prediction_id: {prediction_id}")
        except Exception as e:
            print(f"[ERROR] Failed to store prediction: {e}")
            prediction_id = None

        # --- Upload Grad-CAM overlay to Node backend and link to prediction ---
        gradcam_url = None
        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmpfile:
            tmpfile.write(buffer.tobytes())
            gradcam_path = tmpfile.name
        try:
            if prediction_id:
                upload_url = f"{NODE_BACKEND_URL}/upload-gradcam"
                print(f"[INFO] Uploading Grad-CAM to {upload_url} for prediction_id {prediction_id} ...")
                with open(gradcam_path, "rb") as f:
                    files = {"file": ("gradcam.jpg", f, "image/jpeg")}
                    data = {"prediction_id": prediction_id}
                    upload_res = requests.post(upload_url, files=files, data=data)
                    print(f"[INFO] Grad-CAM upload response status: {upload_res.status_code}")
                    print(f"[INFO] Grad-CAM upload response: {upload_res.text}")
                    upload_res.raise_for_status()
                    gradcam_url = upload_res.json().get("url")
            else:
                print("[WARN] No prediction_id, skipping Grad-CAM upload.")
        except Exception as e:
            print(f"[ERROR] Failed to upload Grad-CAM: {e}")
            gradcam_url = None
        finally:
            os.remove(gradcam_path)

        return JSONResponse(content={
            "prediction": pred_response,
            "gradcam_overlay_b64": gradcam_b64,
            "gradcam_url": gradcam_url,
            "prediction_id": prediction_id
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/gradcam/")
async def gradcam(file: UploadFile = File(...)):
    try:
        # Load image
        image = Image.open(io.BytesIO(await file.read())).convert('RGB')
        input_tensor = test_transform(image).unsqueeze(0).to(device)

        # Forward pass
        model.zero_grad()
        outputs = model(input_tensor)
        predicted = torch.argmax(outputs, 1)
        class_score = outputs[0, predicted.item()]
        class_score.backward()

        # Extract activation & gradient
        activation = activations[0].squeeze().detach()
        gradient = gradients[0].squeeze().detach()
        weights = gradient.mean(dim=(1, 2))
        cam = (weights[:, None, None] * activation).sum(dim=0)
        cam = F.relu(cam)
        cam -= cam.min()
        cam /= cam.max()
        cam = cam.cpu().numpy()

        # Generate heatmap
        heatmap = cv2.resize(cam, (224, 224))
        heatmap = np.uint8(255 * heatmap)
        heatmap = cv2.applyColorMap(heatmap, cv2.COLORMAP_JET)

        # Original image for overlay
        orig_img = image.resize((224, 224))
        orig_np = np.array(orig_img)
        if orig_np.ndim == 2:  # grayscale
            orig_np = cv2.cvtColor(orig_np, cv2.COLOR_GRAY2RGB)

        overlay = cv2.addWeighted(orig_np, 0.5, heatmap, 0.5, 0)

        # Convert overlay to bytes
        _, buffer = cv2.imencode('.jpg', overlay)
        return StreamingResponse(io.BytesIO(buffer.tobytes()), media_type="image/jpeg")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Clean buffers and remove hooks on shutdown
@app.on_event("shutdown")
def cleanup():
    activations.clear()
    gradients.clear()
    forward_handle.remove()
    backward_handle.remove()

# Health check endpoint for deployment
@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "skin-disease-model-api"}

# For development only
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 8000)))