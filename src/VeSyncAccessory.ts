import {Service, Units} from 'homebridge';

import Platform, {VeSyncPlatformAccessory} from './platform';
import CurrentState from './characteristics/CurrentState';
import Humidity from './characteristics/Humidity';
import Active from './characteristics/Active';
import VeSyncFan from './api/VeSyncFan';
import MistLevel from "./characteristics/MistLevel";
import TargetState from "./characteristics/TargetState";
import WarmLevel from "./characteristics/WarmLevel";
import * as util from "util";

export type AccessoryThisType = ThisType<{
    humidifierService: Service;
    coolService: Service;
    warmService: Service;
    platform: Platform;
    device: VeSyncFan;
}>;

export default class VeSyncAccessory {
    private humiditySensorService: Service;
    private humidifierService: Service;
    // private coolService: Service;
    private warmService: Service | undefined;

    public get UUID() {
        return this.device.uuid.toString();
    }

    private get device() {
        return this.accessory.context.device;
    }

    private get getMistValues() {
        /*
        Determines the number of level values to slide through in a slider.
        Returns an array that contains the range of values between 0 and (levels + 1).
        We add 1 to the levels to account for 0 as a potential level.
        Example: The Classic300s has 9 mist levels, so this function returns [0,1,2,3,4,5,6,7,8,9].
         */
        const arr = [...Array(this.device.deviceType.mistLevels + 1).keys()];
        return arr;
    }

    private get getWarmValues() {
        /*
        Determines the number of level values to slide through in a slider.
        Returns an array that contains the range of values between 0 and (levels + 1).
        We add 1 to the levels to account for 0 as a potential level.
        Example: The LV600S has 3 warm levels, so this function returns [0,1,2,3].
         */
        const arr = [...Array(this.device.deviceType.warmLevels + 1).keys()];
        return arr;
    }

    constructor(
        private readonly platform: Platform,
        private readonly accessory: VeSyncPlatformAccessory
    ) {
        const {manufacturer, model, mac} = this.device;

        this.accessory
            .getService(this.platform.Service.AccessoryInformation)!
            .setCharacteristic(
                this.platform.Characteristic.Manufacturer,
                manufacturer
            )
            .setCharacteristic(this.platform.Characteristic.Model, model)
            .setCharacteristic(this.platform.Characteristic.SerialNumber, mac)
            .setCharacteristic(this.platform.Characteristic.Identify, true);


        this.humidifierService =
            this.accessory.getService("Cool Mist") ||
            this.accessory.addService(new this.platform.Service.HumidifierDehumidifier("Cool Mist", "Cool"));

        this.humiditySensorService =
            this.accessory.getService(this.platform.Service.HumiditySensor) ||
            this.accessory.addService(this.platform.Service.HumiditySensor);

        this.humidifierService.setPrimaryService(true);
        this.humidifierService.addLinkedService(this.humiditySensorService);

        this.humidifierService
            .getCharacteristic(this.platform.Characteristic.Active)
            .onGet(Active.get.bind(this))
            .onSet(Active.set.bind(this));

        this.humidifierService
            .getCharacteristic(this.platform.Characteristic.TargetHumidifierDehumidifierState)
            .setProps({
                validValues: [0, 1],
            })
            .onGet(TargetState.get.bind(this))
            .onSet(TargetState.set.bind(this));

        this.humidifierService
            .getCharacteristic(this.platform.Characteristic.CurrentHumidifierDehumidifierState)
            .setProps({
                validValues: [0, 1, 2],
            })
            .onGet(CurrentState.get.bind(this));

        this.humidifierService.getCharacteristic(this.accessory.displayName)?.setValue("hi")
        this.humidifierService
            .getCharacteristic(this.platform.Characteristic.RelativeHumidityHumidifierThreshold)
            .setProps({
                minStep: 1,
                minValue: 0,
                maxValue: this.device.deviceType.mistLevels,
                validValues: this.getMistValues,
                description: "Cool Mist Level"

            })
            .onGet(MistLevel.get.bind(this))
            .onSet(MistLevel.set.bind(this));

        if (this.device.deviceType.hasWarmMode) {
            this.warmService = this.accessory.getService("Warm Mist") ||
                this.accessory.addService(new this.platform.Service.HumidifierDehumidifier("Warm Mist", 'Warm'))


            this.warmService
                .getCharacteristic(this.platform.Characteristic.TargetHumidifierDehumidifierState)
                .setProps({
                    validValues: [0, 1],
                })
                .onGet(TargetState.get.bind(this))
                .onSet(TargetState.set.bind(this));

            this.warmService
                .getCharacteristic(this.platform.Characteristic.CurrentHumidifierDehumidifierState)
                .setProps({
                    validValues: [0, 1, 2],
                })
                .onGet(CurrentState.get.bind(this));

            this.warmService.getCharacteristic(this.platform.Characteristic.RelativeHumidityHumidifierThreshold)
                .setProps({
                    minStep: 1,
                    minValue: 0,
                    maxValue: this.device.deviceType.warmLevels,
                    validValues: this.getWarmValues,
                    description: "Warm Mist Level"
                })
                .onGet(WarmLevel.get.bind(this))
                .onSet(WarmLevel.set.bind(this));
        }

        this.humidifierService
            .getCharacteristic(this.platform.Characteristic.CurrentRelativeHumidity)
            .onGet(Humidity.get.bind(this));

        this.humiditySensorService
            .getCharacteristic(this.platform.Characteristic.CurrentRelativeHumidity)
            .onGet(Humidity.get.bind(this));

    }
}
