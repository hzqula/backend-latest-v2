import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { validate } from "../middlewares/validation.middleware";
import {
  RegisterEmailSchema,
  VerifyOtpSchema,
  RegisterUserSchema,
} from "../dtos/auth.dto";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();
const authController = new AuthController();

router.post(
  "/register/email",
  validate(RegisterEmailSchema),
  authController.registerEmail.bind(authController)
);
router.post(
  "/register/verify-otp",
  validate(VerifyOtpSchema),
  authController.verifyOtp.bind(authController)
);
router.post(
  "/register/user",
  upload.single("profilePicture"),
  validate(RegisterUserSchema),
  authController.registerUser.bind(authController)
);

export default router;
