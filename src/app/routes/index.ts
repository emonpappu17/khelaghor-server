import { Router } from "express"
import { AuthRoutes } from "../modules/auth/auth.routes"

export const router = Router()

const moduleRoutes = [
    {
        path: "/auth",
        route: AuthRoutes
    },
    // {
    //     path: "/user",
    //     route: UserRoutes
    // },
]

moduleRoutes.forEach((route) => {
    router.use(route.path, route.route)
})