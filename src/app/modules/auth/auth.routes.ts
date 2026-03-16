import { NextFunction, Request, Response, Router } from 'express';
import validateRequest from '../../middlewares/validateRequest';
import { AuthValidation } from './auth.validation';
import { AuthController } from './auth.controller';
import { checkAuth } from '../../middlewares/checkAuth';
import passport from 'passport';
import { env } from '../../config/env';

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
    "/refresh-token",
    AuthController.getNewAccessToken
)

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
    "/reset-password",
    validateRequest(AuthValidation.resetPasswordSchema),
    AuthController.resetPassword
);

router.post(
    '/logout',
    checkAuth(),
    AuthController.logout
);

router.get(
    '/google',
    (req: Request, res: Response, next: NextFunction) => {
        // const state = req.query.role === 'HOST' ? 'HOST' : 'USER';
        const redirect = req.query.redirect || "/"
        passport.authenticate("google", { scope: ['profile', 'email'], state: redirect as string })(req, res, next);
    }
);

router.get(
    '/google/callback',
    passport.authenticate('google', { failureRedirect: `${env.CLIENT_URL}/login?error=There is some issue with your account. Please contact with out support team!`, session: false }),
    AuthController.googleCallback
);


export const AuthRoutes = router;
