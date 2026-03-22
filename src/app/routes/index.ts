import { Router } from "express"
import { AuthRoutes } from "../modules/auth/auth.routes"
import { UserRoutes } from "../modules/user/user.routes"
import { HostRoutes } from "../modules/host/host.routes"

export const router = Router()

const moduleRoutes = [
    {
        path: "/auth",
        route: AuthRoutes
    },
    {
        path: "/users",
        route: UserRoutes
    },
    {
        path: "/hosts",
        route: HostRoutes
    },
]

moduleRoutes.forEach((route) => {
    router.use(route.path, route.route)
})