import { expect, test, describe, beforeEach, vi } from 'vitest'
import { PostmanImporter } from '../postmanImporter'

describe('PostmanImporter TDD - Nested Collections', () => {
  test('should import requests from deeply nested folders', () => {
    const nestedJson = JSON.stringify({
      info: {
        name: 'Deeply Nested Collection',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
      },
      item: [
        {
          name: 'Folder Level 1',
          item: [
            {
              name: 'Folder Level 2',
              item: [
                {
                  name: 'Nested Request',
                  request: {
                    method: 'GET',
                    url: {
                      raw: 'https://api.example.com/nested',
                      protocol: 'https',
                      host: ['api', 'example', 'com'],
                      path: ['nested']
                    },
                    header: []
                  }
                }
              ]
            },
            {
              name: 'Level 1 Request',
              request: {
                method: 'POST',
                url: 'https://api.example.com/level1',
                header: []
              }
            }
          ]
        }
      ]
    });

    const { collection, requests } = PostmanImporter.parseCollection(nestedJson);

    // This is expected to fail or show 0 requests if the recursion is broken
    expect(collection.name).toBe('Deeply Nested Collection');
    
    // The bug report says requests in subfolders are ignored.
    // In this mock, we have 2 requests: 'Nested Request' and 'Level 1 Request'.
    expect(requests).toHaveLength(2);
    
    const nestedReq = requests.find(r => r.name === 'Nested Request');
    expect(nestedReq).toBeDefined();
    expect(nestedReq?.metadata?.path).toEqual(['Folder Level 1', 'Folder Level 2']);
    
    const level1Req = requests.find(r => r.name === 'Level 1 Request');
    expect(level1Req).toBeDefined();
    expect(level1Req?.metadata?.path).toEqual(['Folder Level 1']);
  });

  test('should assign default values for mandatory fields if missing', () => {
    const incompleteJson = JSON.stringify({
      info: { name: 'Incomplete', schema: 'v2.1' },
      item: [
        {
          name: 'Missing URL',
          request: {
            method: 'GET'
            // url is missing
          }
        },
        {
          name: 'Missing Method',
          request: {
            url: 'https://api.com'
            // method is missing
          }
        }
      ]
    });

    const { requests } = PostmanImporter.parseCollection(incompleteJson);
    
    expect(requests[0].url).toBe('http://localhost'); // Default value
    expect(requests[1].method).toBe('GET'); // Default value
  });
});
