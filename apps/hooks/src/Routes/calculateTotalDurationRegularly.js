import YAML from 'yaml';
import { DateTime } from 'luxon';
import { GraphQLClient } from '@happy-path/graphql-client';
import * as priceModifiers from '../Price/Modifiers.js';

const calculateTotalDurationRegularly = async (req, res, next) => {
  // TODO: Should update only if there are changed values
  if(req.body.metadata != undefined) {
    const queryResponse = await GraphQLClient.query(TimersWithNoEndDateQuery);
    if(queryResponse?.data?.timers != undefined && queryResponse?.data?.timers.length > 0) {
      queryResponse.data.timers.forEach(async (item) => {
        let defaultMetadataString = '';
        const startsAt = DateTime.fromISO(item.starts_at);
        const { minutes: durationInMinutes } = DateTime.now().diff(startsAt, 'minutes').toObject();
        const totalDuration = Math.floor(durationInMinutes + item.duration);
        const totalDurationInHours = +((totalDuration / 60).toFixed(2));
        defaultMetadataString += req.body.metadata[0].metadata.trim();
        defaultMetadataString += '\n';
        defaultMetadataString += item?.task?.projects_id?.metadata || '';
        try {
          const totalCost = calculateTotalCost({metadata: defaultMetadataString, totalDurationInHours, totalDuration, email: item.user_id.email, startsAt, endsAt: DateTime.now()});
          if(totalCost != undefined) {
            const mutationResponse = await GraphQLClient.mutation(TimersMutation, { timerId: item.id, totalDuration, totalDurationInHours, totalCost });
            if(mutationResponse.error != undefined) {
              res.log.error(mutationResponse.error);
            }
          }
          else {
            res.log.debug(`Total cost is undefined for timer ID: ${item.id}`);
          }
        }
        catch(e) {
          res.log.error(e);
        }
      });
      res.json({ok: true});
    }
    else {
      res.status(404).send({error: `No running timers were found. Exiting.`});
    }
  }
  else {
    res.log.debug(req.body);
    res.status(403).send({error: `Metadata is missing. Exiting.`});
  }
}

const calculateTotalCost = (params) => {
  const { email, totalDurationInHours, totalDuration, startsAt, endsAt, metadata: defaultMetadataString } = params;
  const metadata = YAML.parse(defaultMetadataString);
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

const TimersWithNoEndDateQuery = `
  query Timers {
    timers(filter: {ends_at: {_null: null}}) {
      id
      user_id {
        email
      }
      duration
      starts_at
      task {
        projects_id {
          metadata
        }
      }
    }
  }
`;

const TimersMutation = `
  mutation update_timers_item($timerId: ID!, $totalDuration: Int!, $totalDurationInHours: Float!, $totalCost: Float!) {
    update_timers_item(id: $timerId, data: {total_duration: $totalDuration, total_duration_in_hours: $totalDurationInHours, total_cost: $totalCost}) {
      id
      total_duration
      total_duration_in_hours
      total_cost
    }
  }
`;

export { calculateTotalDurationRegularly }