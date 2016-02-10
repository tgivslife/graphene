import * as core from "./core";
import * as pkcs11 from "./pkcs11";
import * as slot from "./slot";

export interface IVersion {
    major: number;
    minor: number;
}

export interface IModuleInfo {
    cryptokiVersion: IVersion;
    manufacturerID: string;
    flags: number;
    libraryDescription: string;
    libraryVersion: IVersion;
}

export class Module extends core.BaseObject implements IModuleInfo {

    libFile: string = "";
    libName: string = "";

    /**
     * Cryptoki interface version
     */
    cryptokiVersion: IVersion;

    /**
     * blank padded manufacturer ID
     */
    manufacturerID: string;

    /**
     * must be zero
     */
    flags: number;

    /**
     * blank padded library description
     */
    libraryDescription: string;

    /**
     * version of library
     */
    libraryVersion: IVersion;

    constructor(lib: pkcs11.Pkcs11) {
        super(lib);

        this.getInfo();
    }

    protected getInfo() {
        let $info = core.Ref.alloc(pkcs11.CK_INFO);

        let rv = this.lib.C_GetInfo($info);
        if (rv) throw new core.Pkcs11Error(rv, "C_GetInfo");

        let info: IModuleInfo = $info.deref();
        this.cryptokiVersion = {
            major: info.cryptokiVersion.major,
            minor: info.cryptokiVersion.minor,
        };
        this.manufacturerID = info.manufacturerID.toString().trim();
        this.libraryDescription = info.libraryVersion.toString().trim();
        this.flags = info.flags;
        this.libraryVersion = {
            major: info.libraryVersion.major,
            minor: info.libraryVersion.minor,
        };
    }

    /**
     * initializes the Cryptoki library
     */
    initialize() {
        let rv = this.lib.C_Initialize();
        if (rv) throw new core.Pkcs11Error(rv, "C_Initialize");
    }

    /**
     * indicates that an application is done with the Cryptoki library
     */
    finalize() {
        let rv = this.lib.C_Finalize();
        if (rv) throw new core.Pkcs11Error(rv, "C_Finalize");
    }

    /**
     * obtains a list of slots in the system
     * @param {number} tokenPresent only slots with tokens. Default `True`
     */
    getSlots(tokenPresent: boolean = true): slot.SlotCollection {
        let $len = core.Ref.alloc(pkcs11.CK_ULONG);
        let rv = this.lib.C_GetSlotList(tokenPresent, null, $len);
        if (rv) throw new core.Pkcs11Error(rv, "C_GetSlotList");
        let arr = [],
            len = $len.deref();
        if (len) {
            let $slots = core.Ref.alloc(core.RefArray(pkcs11.CK_SLOT_ID, len));
            if (rv = this.lib.C_GetSlotList(tokenPresent, $slots, $len)) {
                throw new core.Pkcs11Error(rv, "C_GetSlotList");
            }
            arr = $slots.deref();
        }
        return new slot.SlotCollection(arr, this.lib);
    }

    /**
     * loads pkcs11 lib
     */
    static load(libFile: string, libName?: string): Module {
        let lib = new pkcs11.Pkcs11(libFile);
        let module = new Module(lib);
        module.libFile = libFile;
        module.libName = libFile;
        return module;
    }

}