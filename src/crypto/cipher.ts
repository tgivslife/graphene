import * as core from "../core";
import * as pkcs11 from "../pkcs11";
import {Session} from "../session";
import * as objects from "../object";
import * as mech from "../mech";

export class Cipher {

    session: Session;
    lib: pkcs11.Pkcs11;

    constructor(session: Session, lib: pkcs11.Pkcs11) {
        this.session = session;
        this.lib = lib;
    }

    init(alg: mech.IAlgorithm, key: objects.Key);
    init(algName: string, key: objects.Key);
    init(alg: any, key: objects.Key) {
        let pMech = mech.Mechanism.create(alg);
        let rv = this.lib.C_EncryptInit(this.session.handle, pMech, key.handle);
        if (rv) throw new core.Pkcs11Error(rv, "C_EncryptInit");
    }

    update(text: string): Buffer;
    update(data: Buffer): Buffer;
    update(data): Buffer {
        data = new Buffer(data);

        let $enc = new Buffer(data.length);
        let $encLen = core.Ref.alloc(pkcs11.CK_ULONG, $enc.length);

        let rv = this.lib.C_EncryptUpdate(this.session.handle, data, data.length, $enc, $encLen);
        if (rv) throw new core.Pkcs11Error(rv, "C_EncryptUpdate");
        if ($enc.length < $encLen.deref()) throw new Error(`Encrypted data wrong data size`);

        return $enc.slice(0, $encLen.deref());
    }

    final(): Buffer {
        let $enc = new Buffer(1024);
        let $encLen = core.Ref.alloc(pkcs11.CK_ULONG, 1024);

        let rv = this.lib.C_EncryptFinal(this.session.handle, $enc, $encLen);
        if (rv) throw new core.Pkcs11Error(rv, "C_EncryptFinal");

        return $enc.slice(0, $encLen.deref());
    }

}