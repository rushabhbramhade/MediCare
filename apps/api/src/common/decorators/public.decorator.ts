import { SetMetadata } from "@nestjs/common";

export const IS_PUBLIC_KEY = "medicare:isPublic";

/** Opts a route out of the global authentication guard. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
