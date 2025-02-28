const {Schema,model}=require('mongoose');
const userSchema = new Schema({
    FirstName: { type: String, required: true },
    LastName: { type: String, required: true },
    googleId: { type: String },
    email: { type: String, required: true, unique: true },
    salt: { type: String },
    password: { type: String, required: true },
    role: { type: String, enum: ["USER", "ADMIN"], default: "USER" },
    googleAccessToken: { type: String },
    googleRefreshToken: { type: String },
    customToken: { type: String },
}, { timestamps: true });

const User=model('usegoogle',userSchema);
module.exports=
    User;
