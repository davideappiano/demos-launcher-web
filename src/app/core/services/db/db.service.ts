import { Injectable } from '@angular/core';
// import * as lowdb from 'lowdb';
import { LoginType, OrgModel, ProfileModel } from '../../../store/orgs/model';
import { Guid } from 'guid-typescript';
import { IpcRenderer } from 'electron';
import { AngularFireDatabase } from '@angular/fire/compat/database';


@Injectable({
  providedIn: 'root',
})
export class DbService {

  constructor(private db: AngularFireDatabase) {  }

  getOrgs(): OrgModel[] {

    this.db.list('orgs').valueChanges().subscribe(e => console.log(e));

    return [];
    // // Migration
    // if (version === undefined) {
    //   // Migration
    //   const newOrgs = orgs.map(org => {

    //     const adminProfile = org.profiles.find(p => (p as any).innerName === (org as any).admin ||
    //       p.name === (org as any).admin);

    //     if (adminProfile !== undefined) {
    //       org.profiles = org.profiles.filter(p => (p as any).innerName !== (org as any).admin &&
    //         p.name !== (org as any).admin);

    //       org.administrator = {
    //         login: adminProfile.login,
    //         pwd: adminProfile.pwd
    //       };
    //     }

    //     const newOrg: OrgModel = {
    //       profiles: org.profiles.map(prof => ({
    //         name: prof.name,
    //         login: prof.login,
    //         pwd: prof.pwd,
    //         loginType: prof.loginType ?? LoginType.standard
    //       })),

    //       id: (org.id === null || org.id === undefined) ? Guid.create().toString() : org.id,
    //       description: org.description,
    //       name: org.name,
    //       administrator: org.administrator,
    //       domain: org.domain
    //     };

    //     return newOrg;
    //   });

    //   this.save(newOrgs);
    //   return newOrgs;
    // }

    // return orgs;
  }

  save(orgs: OrgModel[]): void {
    // this.ipc.sendSync('db:write', orgs, 'db.json', 'orgs');
    // this.ipc.sendSync('db:write', 2, 'db.json', 'version');
  }
}
