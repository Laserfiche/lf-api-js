// Copyright Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.

import { AccessKey } from "../lib/OAuth/AccessKey";

// used as unit test constants - NOT valid application credentials

export const testAccessKeyJSON: string = `{
  "customerId": "123456789",
  "clientId": "525524b2-afe6-47ca-8ed7-98262651047f",
  "domain": "a.clouddev.laserfiche.com",
  "jwk": {
    "kty": "EC",
    "crv": "P-256",
    "use": "sig",
    "kid": "uGHpMS2KM8vMi1X_eKnE7hOJiQ_2sQNT8rOS2Jl2rIs",
    "x": "n9lA6bKMu_2qAjHyCta4ZGrKNClIpskvwS61Gn9WFZw",
    "y": "K6g8XmvM6PcgQD4NOsBoU-Ly_xa7_3AH8vs6YfHtnIU",
    "d": "cYrEewJSOJYnvqU11fA7OQzHMSjPBu2mGYWeQJ5cAuQ",
    "createdTime": "2024-09-12T18:58:44.5957817Z"
  }
}`;

export const testAccessKeyFromJson: AccessKey = JSON.parse(testAccessKeyJSON);

export const testServicePrincipalKey: string = 'BxLS6xxrW4Ln2aP_n6kU';

export const testAccessKeyBase64Encoded: string =
  'ewoJImN1c3RvbWVySWQiOiAiMTIzNDU2Nzg5IiwKCSJjbGllbnRJZCI6ICI1MjU1MjRiMi1hZmU2LTQ3Y2EtOGVkNy05ODI2MjY1MTA0N2YiLAoJImRvbWFpbiI6ICJhLmNsb3VkZGV2Lmxhc2VyZmljaGUuY29tIiwKCSJqd2siOiB7CgkJImt0eSI6ICJFQyIsCgkJImNydiI6ICJQLTI1NiIsCgkJInVzZSI6ICJzaWciLAoJCSJraWQiOiAidUdIcE1TMktNOHZNaTFYX2VLbkU3aE9KaVFfMnNRTlQ4ck9TMkpsMnJJcyIsCgkJIngiOiAibjlsQTZiS011XzJxQWpIeUN0YTRaR3JLTkNsSXBza3Z3UzYxR245V0ZadyIsCgkJInkiOiAiSzZnOFhtdk02UGNnUUQ0Tk9zQm9VLUx5X3hhN18zQUg4dnM2WWZIdG5JVSIsCgkJImQiOiAiY1lyRWV3SlNPSlludnFVMTFmQTdPUXpITVNqUEJ1Mm1HWVdlUUo1Y0F1USIsCgkJImNyZWF0ZWRUaW1lIjogIjIwMjQtMDktMTJUMTg6NTg6NDQuNTk1NzgxN1oiCgl9Cn0=';
