import {
    CharacteristicGetHandler,
    CharacteristicSetHandler,
    CharacteristicValue,
    Nullable
} from 'homebridge';
import VeSyncFan, {Mode} from '../api/VeSyncFan';

import {AccessoryThisType} from '../VeSyncAccessory';
import {json} from "stream/consumers";

const characteristic: {
    get: CharacteristicGetHandler;
    set: CharacteristicSetHandler;
} & AccessoryThisType = {
    get: async function (): Promise<Nullable<CharacteristicValue>> {
        await this.device.updateInfo();
        return this.device.isOn ? this.device.mistLevel : 0;
    },

    set: async function (value: CharacteristicValue) {
        if (value == 0) {
            await this.device.setPower(false);
        } else {
            if (!this.device.deviceType.hasWarmMode) {
                await this.device.changeMode(Mode.Manual);
            }
            await this.device.changeCoolMistLevel(Number(value));
        }
    }
};

export default characteristic;
