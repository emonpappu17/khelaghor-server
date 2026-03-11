import { Router } from 'express';
import validateRequest from '../../middlewares/validateRequest';
import { AuthValidation } from './auth.validation';
import { AuthController } from './auth.controller';
import { checkAuth } from '../../middlewares/checkAuth';

const router = Router();

router.post(
    '/register',
    validateRequest(AuthValidation.registerSchema),
    AuthController.register
);

router.post(
    '/login',
    validateRequest(AuthValidation.loginSchema),
    AuthController.login
);

router.post(
    '/change-password',
    checkAuth(),
    validateRequest(AuthValidation.changePasswordSchema),
    AuthController.changePassword
)

router.post(
    '/forgot-password',
    validateRequest(AuthValidation.forgotPasswordSchema),
    AuthController.forgotPassword
)

router.post(
    "/verify-otp",
    validateRequest(AuthValidation.verifyOptSchema),
    AuthController.verifyForgotPasswordOtp
);

router.post(
    '/logout',
    AuthController.logout
);

export const AuthRoutes = router;
