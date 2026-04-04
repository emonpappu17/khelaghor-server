import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { IPNInput, RedirectInput } from "./payment.validation";
import { PaymentService } from "./payment.service";

const handleIPN = catchAsync(async (req: Request, res: Response) => {
    const ipnData = req.body as IPNInput;

    console.log(`[IPN] Received for tran_id: ${ipnData.tran_id}, status: ${ipnData.status}`);

    const result = await PaymentService.handleIPN(ipnData);

    res.status(200).json({
        success: true,
        message: result.message,
    });
});

const handleSuccess = catchAsync(async (req: Request, res: Response) => {
    const { tran_id } = req.body as RedirectInput;

    const result = await PaymentService.handleSuccess(tran_id);

    res.redirect(result.redirectUrl);
});

export const PaymentController = {
    handleSuccess,
    handleIPN
};
