import { Roles } from "../constants/roles";

export interface RouteData {
    [Roles.ADMIN]?: boolean;
    [Roles.USER]?: boolean;
  }