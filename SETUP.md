# 🚀 Quick Setup Guide

## ✅ **Already Configured**
- **MongoDB**: Running on localhost:27017 ✅
- **Backend**: Running on localhost:5000 ✅
- **Frontend**: Running on localhost:3000 ✅
- **Database Connection**: Tested and working ✅

## 🔑 **Get Hugging Face API Key**

### **Step 1: Create Account**
1. Go to [https://huggingface.co](https://huggingface.co)
2. Click "Sign Up" → Create account
3. Verify email

### **Step 2: Get API Token**
1. Login → Profile → Settings
2. Click "Access Tokens" tab
3. Click "New token"
4. Name: "AI Image Generator"
5. Permissions: "Read" + "Write"
6. Click "Generate a token"
7. **Copy the token** (starts with `hf_`)

### **Step 3: Add to Project**
1. Open `backend/.env` file
2. Replace `hf_your_actual_api_key_here` with your actual token
3. Save the file

### **Example .env:**
```bash
# Replace this line:
HUGGINGFACE_API_KEY=hf_your_actual_api_key_here

# With your actual token:
HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## 🔄 **Restart Backend**
```bash
cd backend
npm restart
```

## 🎯 **Test the System**
1. Go to http://localhost:3000
2. Register/Login
3. Try generating an image
4. Check analytics dashboard

## 📊 **Available Features**
- ✅ User Authentication
- ✅ Image Generation (with mock fallback)
- ✅ Analytics Dashboard
- ✅ Data Science Module
- ✅ Recommendation System

## 🐛 **Troubleshooting**

### **MongoDB Issues**
```bash
# Start MongoDB manually
mongod --dbpath C:\data\db --port 27017
```

### **Backend Issues**
```bash
# Check backend logs
cd backend
npm start
```

### **Frontend Issues**
```bash
# Restart frontend
cd frontend
npm start
```

### **API Key Issues**
- Ensure token starts with `hf_`
- Check token permissions (Read + Write)
- Verify no extra spaces in .env file

## 🌐 **Access Points**
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Analytics**: Click 📊 in navigation
- **MongoDB**: localhost:27017

## 📞 **Need Help?**
1. Check console logs for errors
2. Verify all services are running
3. Ensure API key is correctly set
4. Check network connectivity

---

**🎉 Your AI Image Generator is ready to use!**
