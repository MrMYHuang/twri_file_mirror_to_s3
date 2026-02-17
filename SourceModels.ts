import type {DailyOperationalStatisticsOfReservoir, ReservoirConditionData} from 'twri-data';
import {Type, Static} from 'typebox';

export const SourceReservoirConditionDataSchema = Type.Object({
  accumulaterainfallincatchment1: Type.String(),
  desiltingtunneloutflow: Type.String(),
  drainagetunneloutflow: Type.String(),
  effectivewaterstoragecapacity: Type.String(),
  inflowdischarge: Type.String(),
  observationtime: Type.String(),
  othersoutflow: Type.String(),
  poweroutletoutflow: Type.String(),
  predeterminedcrossflow: Type.String(),
  predeterminedoutflowtime: Type.String(),
  reservoiridentifier: Type.String(),
  spillwayoutflow: Type.String(),
  statustype: Type.String(),
  totaloutflow: Type.String(),
  waterdraw: Type.String(),
  waterlevel: Type.String(),
}, {
  additionalProperties: false
});

export interface SourceReservoirConditionData extends Static<typeof SourceReservoirConditionDataSchema> {}

export function mapToReservoirConditionData(item: SourceReservoirConditionData): ReservoirConditionData {
  return {
    accumulaterainfallincatchment: Number(item.accumulaterainfallincatchment1 as string),
    desiltingtunneloutflow: Number(item.desiltingtunneloutflow as string),
    drainagetunneloutflow: Number(item.drainagetunneloutflow as string),
    effectivewaterstoragecapacity: Number(item.effectivewaterstoragecapacity as string),
    inflowdischarge: Number(item.inflowdischarge as string),
    observationtime: item.observationtime as string,
    othersoutflow: Number(item.othersoutflow as string),
    poweroutletoutflow: Number(item.poweroutletoutflow as string),
    predeterminedcrossflow: Number(item.predeterminedcrossflow as string),
    predeterminedoutflowtime: item.predeterminedoutflowtime as string,
    reservoiridentifier: Number(item.reservoiridentifier as string),
    spillwayoutflow: Number(item.spillwayoutflow as string),
    statustype: Number(item.statustype as string),
    totaloutflow: Number(item.totaloutflow as string),
    waterdraw: Number(item.waterdraw as string),
    waterlevel: Number(item.waterlevel as string),
  };
}

export function mapToDailyOperationalStatistics(item: SourceDailyOperationalStatisticsOfReservoir): DailyOperationalStatisticsOfReservoir {
  return {
    crossflow: Number(item.crossflow as string),
    capacity: Number(item.capacity as string),
    outflow: Number(item.outflow as string),
    outflowdischarge: Number(item.outflowdischarge as string),
    outflowtotal: Number(item.outflowtotal as string),
    regulatorydischarge: Number(item.regulatorydischarge as string),
    reservoiridentifier: item.reservoiridentifier as string,
    reservoirname: item.reservoirname as string,
    basinrainfall: item.basinrainfall as string,
    datetime: item.datetime as string,
    dwl: item.dwl as string,
    inflow: item.inflow as string,
    nwlmax: item.nwlmax as string,
  };
}

export const SourceDailyOperationalStatisticsOfReservoirSchema = Type.Object({
  basinrainfall: Type.String(),
  capacity: Type.String(),
  crossflow: Type.String(),
  datetime: Type.String(),
  dwl: Type.String(),
  inflow: Type.String(),
  nwlmax: Type.String(),
  outflow: Type.String(),
  outflowdischarge: Type.String(),
  outflowtotal: Type.String(),
  regulatorydischarge: Type.String(),
  reservoiridentifier: Type.String(),
  reservoirname: Type.String(),
}, {
  additionalProperties: false
});

export interface SourceDailyOperationalStatisticsOfReservoir extends Static<typeof SourceDailyOperationalStatisticsOfReservoirSchema> {}
