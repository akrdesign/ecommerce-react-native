const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const app = express();
const port = 8000;
const cors = require("cors");
app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const jwt = require("jsonwebtoken");

mongoose
  .connect("mongodb+srv://akrdesign:ankur@cluster0.bdqefic.mongodb.net/", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to mongoDB");
  })
  .catch((error) => {
    console.log("Error connecting to mongoDB", error);
  });

app.listen(port, () => {
  console.log("Server is running on post 8000");
});

const User = require("./models/user");
const Order = require("./models/order");

// Function to send verification email to user
const sendVerificationEmail = async (email, verificationToken) => {
  // Create nodemailer transport

  const transporter = nodemailer.createTransport({
    // Configure the email service
    service: "gmail",
    auth: {
      user: "akrdesign04@gmail.com",
      pass: "",
    },
  });

  // Compose the email message
  const mailOptions = {
    from: "fakeamazon.com",
    to: email,
    subject: "Email verification",
    text: `Please check the below link to verify your email http://localhost:8000/verify/${verificationToken}`,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.log("Error sending email verification", error);
  }
};

// Endpoint to register in the app
app.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if the email is already registered
    const exitingUSer = await User.findOne({ email });
    if (exitingUSer) {
      return res.status(400).json({ message: "Email already registered!" });
    }

    // Create new user
    const newUser = new User({ name, email, password });

    // Generate and store the verification token
    newUser.verificationToken = crypto.randomBytes(20).toString("hex");

    // Save the user to the database
    await newUser.save();

    // Send verification email to the user
    sendVerificationEmail(newUser.name, newUser.verificationToken);
  } catch (error) {
    console.log("error, registering user", error);
    res.status(500).json({ message: "Registration failed!" });
  }
});

// Endpoint to verify email
app.get("/verify/:token", async (req, res) => {
  try {
    const token = req.params.token;

    // Find the user with the given verification token
    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      return res.status(404).json({ message: "Invalid verification token" });
    }

    // Mark the user is verify
    user.verified = true;
    user.verificationToken = undefined;

    await user.save();

    res.status(200).json({ message: "Email verified successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Email verification failed!" });
  }
});
