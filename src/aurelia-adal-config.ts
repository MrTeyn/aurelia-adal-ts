export interface AureliaAdalConfig {
    tenant?: string;
    clientId?: string;
    endpoints?: { [id: string]: string; };
}