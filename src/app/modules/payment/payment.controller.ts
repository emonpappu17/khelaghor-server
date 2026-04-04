import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { RedirectInput } from "./payment.validation";
import { PaymentService } from "./payment.service";

const handleSuccess = catchAsync(async (req: Request, res: Response) => {
    const { tran_id } = req.body as RedirectInput;

    const result = await PaymentService.handleSuccess(tran_id);

    res.redirect(result.redirectUrl);
});

export const PaymentController = {
    handleSuccess,
};
