// Copyright Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
/** A machine-readable format for specifying errors in HTTP API responses based on https://tools.ietf.org/html/rfc7807. */
export class ProblemDetails implements IProblemDetails {
    /** The problem type. */
    type?: string | undefined;
    /** A short, human-readable summary of the problem type. */
    title?: string | undefined;
    /** The HTTP status code. */
    status!: number;
    /** A human-readable explanation specific to this occurrence of the problem. */
    detail?: string | undefined;
    /** A URI reference that identifies the specific occurrence of the problem. */
    instance?: string | undefined;
    /** The operation id. */
    operationId?: string | undefined;
    /** The error source. */
    errorSource?: string | undefined;
    /** The error code. */
    errorCode?: number;
    /** The trace id. */
    traceId?: string | undefined;
    /** A property that may contain additional info such as in the case of partial success responses. */
    extensions?: Record<string, unknown>;

    constructor(data?: IProblemDetails) {
        if (data) {
            for (const property in data) {
                if (Object.prototype.hasOwnProperty.call(data, property))
                    (this as Record<string, unknown>)[property] = (data as unknown as Record<string, unknown>)[property];
            }
        }
    }

    init(_data?: Record<string, unknown>) {
        if (_data) {
            this.type = _data["type"] as string | undefined;
            this.title = _data["title"] as string | undefined;
            this.status = _data["status"] as number;
            this.detail = _data["detail"] as string | undefined;
            this.instance = _data["instance"] as string | undefined;
            this.operationId = _data["operationId"] as string | undefined;
            this.errorSource = _data["errorSource"] as string | undefined;
            this.errorCode = _data["errorCode"] as number | undefined;
            this.traceId = _data["traceId"] as string | undefined;
        }
    }

    static fromJS(data: Record<string, unknown>): ProblemDetails {
        const typedData = typeof data === 'object' ? (data as Record<string, unknown>) : {};
        const result = new ProblemDetails();
        result.init(typedData);
        return result;
    }

    toJSON(data?: Record<string, unknown>) {
        const result = typeof data === 'object' ? (data as Record<string, unknown>) : {};
        result["type"] = this.type;
        result["title"] = this.title;
        result["status"] = this.status;
        result["detail"] = this.detail;
        result["instance"] = this.instance;
        result["operationId"] = this.operationId;
        result["errorSource"] = this.errorSource;
        result["errorCode"] = this.errorCode;
        result["traceId"] = this.traceId;
        return result;
    }
}

/** A machine-readable format for specifying errors in HTTP API responses based on https://tools.ietf.org/html/rfc7807. */
export interface IProblemDetails {
    /** The problem type. */
    type?: string | undefined;
    /** A short, human-readable summary of the problem type. */
    title?: string | undefined;
    /** The HTTP status code. */
    status: number;
    /** A human-readable explanation specific to this occurrence of the problem. */
    detail?: string | undefined;
    /** A URI reference that identifies the specific occurrence of the problem. */
    instance?: string | undefined;
    /** The operation id. */
    operationId?: string | undefined;
    /** The error source. */
    errorSource?: string | undefined;
    /** The error code. */
    errorCode?: number;
    /** The trace id. */
    traceId?: string | undefined;
    /** A property that may contain additional info such as in the case of partial success responses. */
    extensions?: Record<string, unknown>;
}
