import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { HostService } from "./host.service";
import type { ApplyHostInput, UpdateHostInput } from "./host.validation";

const apply = catchAsync(async (req: Request, res: Response) => {
    const userId = req.authUser.userId;
    const payload = req.body as ApplyHostInput;

    const host = await HostService.applyHost(userId, payload);

    sendResponse(res, {
        statusCode: 201,
        success: true,
        message: "Host profile applied successfully",
        data: host,
    });
});

const getMine = catchAsync(async (req: Request, res: Response) => {
    const userId = req.authUser.userId;
    const host = await HostService.getHostByUserId(userId);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Host profile fetched successfully",
        data: host,
    });
});

const updateMine = catchAsync(async (req: Request, res: Response) => {
    const userId = req.authUser.userId;
    const payload = req.body as UpdateHostInput;
    const host = await HostService.updateHost(userId, payload);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Host profile updated successfully",
        data: host,
    });
});

const listHosts = catchAsync(async (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const isApproved = req.query.isApproved !== undefined ? req.query.isApproved === "true" : undefined;

    const { hosts, total } = await HostService.listHosts({ page, limit, isApproved });

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Hosts fetched successfully",
        meta: { page, limit, total },
        data: hosts,
    });
});

const getHost = catchAsync(async (req: Request, res: Response) => {
    const hostId = req.params.id;
    const host = await HostService.getHostById(hostId as string);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Host fetched successfully",
        data: host,
    });
});

const approveHost = catchAsync(async (req: Request, res: Response) => {
    const hostId = req.params.id;
    const host = await HostService.approveHost(hostId as string);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Host approved successfully",
        data: host,
    });
});

export const HostController = {
    apply,
    getMine,
    updateMine,
    listHosts,
    getHost,
    approveHost,
};
