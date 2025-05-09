const JWT = require("jsonwebtoken");
const secret = process.env.JWT_SECRET;; // 

function createTokenForUser(user) {
    const payload = {
        idNumber: user.idNumber, // 
        email: user.email,
        role: user.role,
         FirstName: user.FirstName,
         
    };

    // ✅ Set token expiry
    return JWT.sign(payload, secret, { expiresIn: "2h" });
}

function validateToken(token) {
    try {
        return JWT.verify(token, secret);
    } catch (error) {
        console.error("Invalid or expired token:", error.message);
        return null; // ✅ Return null instead of crashing the app
    }
}

module.exports = {
    createTokenForUser,
    validateToken,
};
