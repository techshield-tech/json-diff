// Sample JSON pair for the "Load sample" action, chosen so the diff view has
// something to show immediately: a removed key (legacyField), an added key
// (profile.location), changed values (active, profile.age), and array
// differences (roles gains an element, tags loses one). Tool-specific.

export const SAMPLE_LEFT = `{
  "id": 1042,
  "name": "Ada Lovelace",
  "active": true,
  "legacyField": "deprecated",
  "roles": ["admin", "editor"],
  "profile": {
    "age": 36,
    "email": "ada@example.com"
  },
  "tags": ["mathematician", "writer"]
}
`;

export const SAMPLE_RIGHT = `{
  "id": 1042,
  "name": "Ada Lovelace",
  "active": false,
  "roles": ["admin", "editor", "viewer"],
  "profile": {
    "age": 37,
    "email": "ada@example.com",
    "location": "London"
  },
  "tags": ["mathematician"]
}
`;
