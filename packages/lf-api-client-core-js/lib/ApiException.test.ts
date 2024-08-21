// Copyright (c) Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { ProblemDetails } from "./ProblemDetails";
import { ApiException } from "./ApiException";

/**
 * Unit Tests
 *
 * @group UnitTests
 */

describe('ApiException', () => {
    const statusCode: number = 404;
    const operationId: string = "123456789";

    test('ApiException returns input problem details', async () => {
        const problemDetailsTitle: string = "Error: Repository with the given Id not found or no connection could be made."
        const problemDetails = ProblemDetails.fromJS({
            "status": statusCode,
            "title": problemDetailsTitle
        });

        const apiException = new ApiException("exception message", statusCode, {}, problemDetails);

        expect(apiException.message).toEqual(problemDetailsTitle);
        expect(apiException.status).toEqual(statusCode);
        expect(apiException.headers).toEqual({});
    });

    test('ApiException returns error message from header', async () => {
        const headers: { [key: string]: any; } = {
            "x-requestid": operationId,
            "x-apiserver-error": "Error%3A%20Repository%20with%20the%20given%20Id%20not%20found%20or%20no%20connection%20could%20be%20made."
        }

        const apiException = new ApiException("exception message", statusCode, headers, null);

        expect(apiException.problemDetails.title).toEqual("Error: Repository with the given Id not found or no connection could be made.");
        expect(apiException.problemDetails.operationId).toEqual(operationId);
        expect(apiException.problemDetails.status).toEqual(statusCode);
        expect(apiException.message).toEqual(apiException.problemDetails.title);
        expect(apiException.status).toEqual(statusCode);
        expect(apiException.headers).toEqual(headers);
    });

    test('ApiException returns default error message', async () => {
        const headers: { [key: string]: any; } = {
            "x-requestid": operationId,
        };
        const apiException = new ApiException("exception message", statusCode, headers, null);

        expect(apiException.problemDetails.title).toEqual(`HTTP status code ${statusCode}`);
        expect(apiException.problemDetails.operationId).toEqual(operationId);
        expect(apiException.problemDetails.status).toEqual(statusCode);
        expect(apiException.message).toEqual(apiException.problemDetails.title);
        expect(apiException.status).toEqual(statusCode);
        expect(apiException.headers).toEqual(headers);
    });
});
  
