// Copyright (c) Laserfiche.
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
    extensions?: any;

    constructor(data?: IProblemDetails) {
        if (data) {
            for (var property in data) {
                if (data.hasOwnProperty(property))
                    (<any>this)[property] = (<any>data)[property];
            }
        }
    }

    init(_data?: any) {
        if (_data) {
            this.type = _data["type"];
            this.title = _data["title"];
            this.status = _data["status"];
            this.detail = _data["detail"];
            this.instance = _data["instance"];
            this.operationId = _data["operationId"];
            this.errorSource = _data["errorSource"];
            this.errorCode = _data["errorCode"];
            this.traceId = _data["traceId"];
        }
    }

    static fromJS(data: any): ProblemDetails {
        data = typeof data === 'object' ? data : {};
        let result = new ProblemDetails();
        result.init(data);
        return result;
    }

    toJSON(data?: any) {
        data = typeof data === 'object' ? data : {};
        data["type"] = this.type;
        data["title"] = this.title;
        data["status"] = this.status;
        data["detail"] = this.detail;
        data["instance"] = this.instance;
        data["operationId"] = this.operationId;
        data["errorSource"] = this.errorSource;
        data["errorCode"] = this.errorCode;
        data["traceId"] = this.traceId;
        return data;
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
    extensions?: any;
}
