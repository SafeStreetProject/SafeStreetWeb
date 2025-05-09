const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("../model/userschema");

mongoose.connect("mongodb://localhost:27017/safestreet");

const users = [
    { idNumber: "23bd1a05c7", password: "Kmit123$", Name: "Santhosh", email: "damerasanthosh2005@gmail.com", role: "admin" },
    { idNumber: "23bd1a05ct", password: "Kmit123$", Name: "Ganesh", email: "saiganeshsaga@gmail.com", role: "user" },
    { idNumber: "23bd1a05cf", password: "Omkar", Name: "Omkar", email: "omkargonnela@gmail.com", role: "user" },
    { idNumber: "23bd1a05dv", password: "Kmit123$", Name: "Nithin", email: "nithinvankudothu7@gmail.com", role: "user" },
    { idNumber: "23bd1a0526", password: "Kmit123$", Name: "Shiva", email: "shivaprasadreddyyerri@gmail.com", role: "user" },
    { idNumber: "24bd5a6605", password: "Kmit123$", Name: "Manikanta", email: "manikada306@gmail.com", role: "user" },
];

async function addOrUpdateUsers() {
    try {
        for (let user of users) {
            const idNumber = user.idNumber.toLowerCase();
            const hashedPassword = await bcrypt.hash(user.password, 10);

            const result = await User.updateOne(
                { idNumber },
                {
                    $set: {
                        idNumber,
                        password: hashedPassword,
                        FirstName: user.Name,
                        email: user.email,
                        role: user.role,
                        totalUploads: 0,
                        pendingIssues: 0,
                        resolvedIssues: 0
                    }
                },
                { upsert: true }
            );

            if (result.upsertedCount > 0) {
                console.log(`✅ User ${idNumber} created successfully`);
            } else if (result.modifiedCount > 0) {
                console.log(`✅ User ${idNumber} updated successfully`);
            } else {
                console.log(`⚠️ User ${idNumber} unchanged (already up-to-date)`);
            }
        }

        console.log("🎉 All users processed successfully!");
        mongoose.connection.close();
    } catch (error) {
        console.error("❌ Error processing users:", error);
        mongoose.connection.close();
    }
}

addOrUpdateUsers();