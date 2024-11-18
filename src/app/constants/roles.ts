export const Roles = {
    ADMIN: 'ADMIN',
    USER: 'USER'
  } as const;

  export type RoleType = typeof Roles[keyof typeof Roles];