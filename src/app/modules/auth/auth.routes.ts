import { Router } from 'express';
import validateRequest from '../../middlewares/validateRequest';
import { AuthValidation } from './auth.validation';
import { AuthController } from './auth.controller';

const router = Router();

router.post(
    '/register',
    validateRequest(AuthValidation.registerSchema),
    AuthController.register
);

//login work

router.post(
    '/login',
    validateRequest(AuthValidation.loginSchema),
    AuthController.login
);



export const AuthRoutes = router;
