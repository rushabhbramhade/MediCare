import { SetMetadata } from "@nestjs/common";

export const SERVICE_AUDITED_KEY = "medicare:serviceAudited";

/**
 * Marks a route whose service writes its own audit event. The global
 * interceptor then skips the success event to avoid a duplicate record, but
 * still records failures that never reach the service.
 */
export const ServiceAudited = () => SetMetadata(SERVICE_AUDITED_KEY, true);
