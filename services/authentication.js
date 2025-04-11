const JWT = require("jsonwebtoken");
const secret = "$hacunamatata"; // 

function createTokenForUser(user) {
    const payload = {
        idNumber: user.idNumber, // 
        // email: user.email,
        // role: user.role,
         FirstName: user.FirstName,
         email: user.email,
    };

    // ✅ Set token expiry
    return JWT.sign(payload, secret, { expiresIn: "1h" });
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
