export const permissions = Object.freeze({
  dashboardRead: "dashboard:read",

  usersReadAny: "users:read:any",
  usersCreate: "users:create",
  usersUpdateAny: "users:update:any",
  usersChangeRole: "users:change-role:any",
  usersChangeStatus: "users:change-status:any",
  usersResetPassword: "users:reset-password:any",

  membersReadAny: "members:read:any",
  membersCreate: "members:create",
  membersUpdateAny: "members:update:any",
  membersDeleteAny: "members:delete:any",

  loansReadAny: "loans:read:any",
  loansCreate: "loans:create",
  loansUpdateAny: "loans:update:any",
  loansApprove: "loans:approve:any",
  loansDisburse: "loans:disburse:any",

  collectionsReadAny: "collections:read:any",
  collectionsCreate: "collections:create",
  collectionsReverse: "collections:reverse",

  savingsReadAny: "savings:read:any",
  savingsDeposit: "savings:deposit",
  savingsWithdraw: "savings:withdraw",

  reportsReadAny: "reports:read:any",
});

export const can = (user, permission) =>
  Boolean(permission) &&
  Array.isArray(user?.permissions) &&
  user.permissions.includes(permission);
