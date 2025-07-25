export const Relay_Lua_Module = () => {
  const _tags = [{ name: "Action", value: "Relay-Module" }];
  return _tags;
};

export const Eval = () => {
  const _tags = [{ name: "Action", value: "Eval" }];
  return _tags;
};

export const Transfer = (
  Recipient: string,
  Quantity: string,
  payload: string,
) => {
  const _tags = [
    { name: "Action", value: "Transfer" },
    { name: "Recipient", value: Recipient },
    { name: "Quantity", value: Quantity },
    { name: "X-Payload", value: payload },
  ];
  return _tags;
};

export const Subscribe = (relay: string) => {
  const _tags = [
    { name: "Action", value: "Subscribe" },
    { name: "Relay", value: relay },
  ];
  return _tags;
};

export const UnSubscribe = (relay: string) => {
  const _tags = [
    { name: "Action", value: "UnSubscribe" },
    { name: "Relay", value: relay },
  ];
  return _tags;
};

export const SetOwner = (owner: string) => {
  const _tags = [
    { name: "Action", value: "SetOwner" },
    { name: "_Owner", value: owner },
  ];
  return _tags;
};

export const SetRelay = (relay: string) => {
  const _tags = [
    { name: "Action", value: "SetRelay" },
    { name: "Relay", value: relay },
  ];
  return _tags;
};

export const GetOwner = () => {
  const _tags = [{ name: "Action", value: "GetOwner" }];
  return _tags;
};

export const Info = () => {
  const _tags = [{ name: "Action", value: "Info" }];
  return _tags;
};

export const QueryFee = (kind: string) => {
  const _tags = [
    { name: "Action", value: "QueryFee" },
    { name: "Kind", value: kind },
  ];
  return _tags;
};

export const Subs = (page: string, size: string) => {
  const _tags = [
    { name: "Action", value: "Subs" },
    { name: "Page", value: page },
    { name: "Size", value: size },
  ];
  return _tags;
};

export const Subscriptions = (page: string, size: string) => {
  const _tags = [
    { name: "Action", value: "Subscriptions" },
    { name: "Page", value: page },
    { name: "Size", value: size },
  ];
  return _tags;
};

export const IsSubscribed = (relay: string) => {
  const _tags = [
    { name: "Action", value: "IsSubscribed" },
    { name: "Relay", value: relay },
  ];
  return _tags;
};

export const FetchFeed = (filters: string) => {
  return [
    { name: "Action", value: "FetchFeed" },
    { name: "Filters", value: filters },
  ];
};

export const FetchEvents = (filters: string) => {
  return [
    { name: "Action", value: "FetchEvents" },
    { name: "Filters", value: filters },
  ];
};

export const UpdateProfile = () => {
  return [{ name: "Action", value: "Update-Profile" }];
};

//REGISTRY METHODS

export const Register = () => {
  return [{ name: "Action", value: "Register" }];
};

export const GetZones = (filters: string, page: string, limit: string) => {
  return [
    { name: "Action", value: "GetZones" },
    { name: "Filters", value: filters },
    { name: "Page", value: page },
    { name: "Limit", value: limit },
  ];
};

export const GetZoneById = (zoneId: string) => {
  return [
    { name: "Action", value: "GetZoneById" },
    { name: "ZoneId", value: zoneId },
  ];
};

export const RelayMessage = (owner: string) => {
  const _tags = [
    { name: "Action", value: "Relay" },
    { name: "_Owner", value: owner },
  ];
  return _tags;
};

export const Relays = (page: string, size: string) => {
  const _tags = [
    { name: "Action", value: "Relays" },
    { name: "Page", value: page },
    { name: "Size", value: size },
  ];
  return _tags;
};
