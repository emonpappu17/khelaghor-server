import { Router } from "express";
import { AuthRoutes } from "../modules/auth/auth.routes";
import { UserRoutes } from "../modules/user/user.routes";
import { HostRoutes } from "../modules/host/host.routes";
import { FieldRoutes } from "../modules/field/field.routes";
import { SlotRoutes } from "../modules/slot/slot.routes";
import { MapRoutes } from "../modules/map/map.routes";
import { BookingRoutes } from "../modules/booking/booking.routes";
import { PaymentRoutes } from "../modules/payment/payment.routes";
import { ReviewRoutes } from "../modules/review/review.routes";

export const router = Router();

const moduleRoutes = [
  {
    path: "/auth",
    route: AuthRoutes,
  },
  {
    path: "/users",
    route: UserRoutes,
  },
  {
    path: "/hosts",
    route: HostRoutes,
  },
  {
    path: "/fields",
    route: FieldRoutes,
  },
  {
    path: "/slots",
    route: SlotRoutes,
  },
  {
    path: "/map",
    route: MapRoutes,
  },
  {
    path: "/bookings",
    route: BookingRoutes,
  },
  {
    path: "/payments",
    route: PaymentRoutes,
  },
  {
    path: "/reviews",
    route: ReviewRoutes,
  },
];

moduleRoutes.forEach((route) => {
  router.use(route.path, route.route);
});
