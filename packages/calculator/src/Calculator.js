import YAML from 'yaml';
import { DateTime } from 'luxon';
import * as priceModifiers from './Price/Modifiers.js';

const calculateTotalCost = (params) => {
  const { email, totalDurationInHours, totalDuration, metadata } = params;
  let { startsAt, endsAt } = params;
  if(typeof startsAt == 'string') startsAt = DateTime.fromISO(startsAt);
  if(typeof endsAt == 'string') endsAt = DateTime.fromISO(endsAt);
  const matchedGroup = metadata?.groups?.filter(group => {
    const { members } = group[Object.keys(group)[0]];
    return members.some(member => member === email);
  });
  let matchedGroupName, totalCost = 0;
  if(matchedGroup?.length > 0) {
    matchedGroupName = Object.keys(matchedGroup[0])[0];
    const matchedPrice = metadata?.prices?.filter(price => {
      const { groups, valid_until: validUntil } = price;
      return (groups.some(group => group === matchedGroupName) && DateTime.now() <= DateTime.fromISO(validUntil));
    });
    if(matchedPrice != undefined && matchedPrice?.length > 0) {
      const priceModifiersToApply = (metadata.price_modifiers !== undefined && typeof metadata.price_modifiers === 'object') ? Object.values(metadata.price_modifiers) : [];
      const availablePriceModifiersToApply = Object.entries(priceModifiers)
        .filter(([methodName, method]) => typeof method === 'function' && priceModifiersToApply.includes(methodName))
        .map(([methodName, method]) => method);
      const price = availablePriceModifiersToApply.reduce((acc, func) => func(acc, totalDuration, startsAt, endsAt), matchedPrice[0]?.price);
      totalCost = +((price * totalDurationInHours).toFixed(2));
    }
  }
  return totalCost;
}

const calculateDuration = (params) => {
  let { startsAt, endsAt, duration } = params;
  if(startsAt == undefined || duration == undefined) throw new Error('Required parameters missing.');
  if(typeof startsAt == 'string') startsAt = DateTime.fromISO(startsAt);
  if(typeof endsAt == 'string') endsAt = DateTime.fromISO(endsAt);
  if(endsAt == undefined) endsAt = DateTime.now();
  const { minutes: durationInMinutes } = endsAt.diff(startsAt, 'minutes').toObject();
  const totalDuration = Math.floor(durationInMinutes + duration);
  const totalDurationInHours = +((totalDuration / 60).toFixed(4));
  return { totalDuration, totalDurationInHours };
}

const metadata = (params) => {
  if(typeof params != 'object' || params.length == 0) throw new Error('Required parameters missing.');
  return YAML.parse(
    params.map(param => (param || '').trim()).join('\n')
  );
}


export { calculateTotalCost, calculateDuration, metadata }