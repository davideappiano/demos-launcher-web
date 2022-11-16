import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, FormBuilder, Validators, FormArray } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { Guid } from 'guid-typescript';
import { NgxSpinnerService } from 'ngx-spinner';
import { SalesforceService } from '../core/services';
import { OrgSave } from '../store/orgs/actions';
import { LoginType, OrgsStateModel, OrgModel, ProfileModel } from '../store/orgs/model';
import { Config } from '../store/config/model';
import { ProfileFormGroup } from './profile-line/profile-line.component';
import { ConfirmDialogService } from '../core/componentes/confirm-dialog/confirm-dialog.service';
import { OrgsInstallChrome } from '../store/chrome/actions';

type OrgFormGroup = FormGroup<{
  name: FormControl<string>;
  mainUser: FormGroup<{
    login: FormControl<string | null | undefined>;
    pwd: FormControl<string | null | undefined>;
  }>;
  profiles: FormArray<ProfileFormGroup>;
}>;

@Component({
  templateUrl: './org-setup.component.html',
  styleUrls: ['./org-setup.component.scss'],
})
export class OrgSetupComponent implements OnInit {
  connection = '';
  user: string | undefined;
  profileForm!: OrgFormGroup;

  sfUsers: { name: string; login: string }[] = [];
  comms: { name: string; url: string }[] = [
    { name: LoginType.standard, url: LoginType.standard },
    { name: LoginType.none, url: LoginType.none }];


  private orgId!: string;

  constructor(private route: ActivatedRoute,
    private dialog: ConfirmDialogService,
    private router: Router,
    private sf: SalesforceService,
    private fb: FormBuilder,
    private spinner: NgxSpinnerService,
    private store: Store) { }

  get profiles() {
    return this.profileForm.controls.profiles as FormArray;
  }

  get mainUser() {
    return this.profileForm.controls.mainUser;
  }

  getProfile(i: number): ProfileFormGroup {
    return this.profiles.controls[i] as ProfileFormGroup;
  }

  ngOnInit(): void {
    this.orgId = this.route.snapshot.paramMap.get('id')!;

    const org = this.store.selectSnapshot<OrgsStateModel>(state => state.orgs).orgs.find(o => o.id === this.orgId);

    const profiles = org?.profiles;

    this.profileForm = this.fb.group({
      name: this.fb.nonNullable.control(org?.name!, { validators : [Validators.required]}),
      profiles: this.fb.array(profiles ? profiles.map(p => this.profileToForm(p)) : []),
      mainUser: this.fb.group({
        login: this.fb.nonNullable.control(org?.administrator?.login, [Validators.email]),
        pwd: this.fb.nonNullable.control(org?.administrator?.pwd, [Validators.required])
      }),
    }) as OrgFormGroup;
  }

  reinstall(): void {

    this.dialog.open({
      title: 'Save & Install',
      message: 'This action will reinstall all your Chrome profiles.\
      \n\nAll already available Profiles will be reset (bookmarks, extensions). \n\nAre you sure?',
      cancelText: 'Cancel',
      confirmText: 'OK'
    }).then(response => {

      if (!response) { return; }

      const org = this.formToOrg();

      this.store.dispatch([
        new OrgSave(org),
        new OrgsInstallChrome(org, true)
      ]);
    });
  }

  onSubmit(): void {

    this.dialog.open({
      title: 'Save & Install',
      message: 'Save your org and install the Chrome profiles?',
      cancelText: 'Cancel',
      confirmText: 'OK'
    }).then(response => {

      if (!response) { return; }

      const org = this.formToOrg();

      this.store.dispatch([
        new OrgSave(org),
        new OrgsInstallChrome(org, false)
      ]);

      this.router.navigate(['/home']);
    });
  }

  async verify(): Promise<void> {
    this.connection = '';
    this.spinner.show();

    const val = this.profileForm.value.mainUser;

    const admin: ProfileModel = {
      login: val?.login!,
      pwd: val?.pwd!,
      name: 'Admin',
      loginType: LoginType.standard
    };

    console.log('Init Connection');
    const conn = await this.sf.connection(admin);

    console.log('Connection Established');
    if (conn.connected) {
      this.user = conn.userInfo?.name;

      await conn.getDbUsers().then((users: { Name: string; Username: string; }[]) => {
        const sfUsers = users
          .map((user: { Name: string; Username: string; }) => ({ name: user.Name, login: user.Username }))
          .sort((a: { name: string; }, b: { name: string; }) => a.name.localeCompare(b.name));

        this.sfUsers = [...sfUsers];
      });

      await conn.getCommunities().then((comms: { Name: any; UrlPathPrefix: any; }[]) => {
        const extracomms = comms
          .map((site: { Name: any; UrlPathPrefix: any; }) => ({ name: site.Name, url: site.UrlPathPrefix }))
          .sort((a: any, b: any) => a.name.localeCompare(b));

        this.comms = [{ name: LoginType.standard, url: LoginType.standard }, { name: LoginType.none, url: LoginType.none }, ...extracomms];
      });

      this.connection = 'Connected';
    }
    else {
      this.connection = 'Error';
    }

    this.spinner.hide();
  }

  deleteProfile(index: number): void {
    this.profiles.removeAt(index);
  }

  duplicateProfile(index: number): void {
    const profile = this.getProfile(index).value;

    const newProfile: ProfileModel = {
      name: '',
      login: profile.login!,
      pwd: profile.pwd!,
      loginType: profile.loginType!
    };

    const formElement = this.profileToForm(newProfile);
    this.profileForm.controls.profiles.push(formElement);
  }

  addProfile(): void {
    const cfg = this.store.selectSnapshot<Config>(state => state.config);

    const newProfile: ProfileModel = {
      name: '',
      login: '',
      pwd: cfg.defaultPassword,
      loginType: LoginType.standard
    };

    const formElement = this.profileToForm(newProfile);
    this.profileForm.controls.profiles.push(formElement);
  }

  private profileToForm(p: ProfileModel): ProfileFormGroup {
    return this.fb.group({
      name: this.fb.nonNullable.control(p.name!, [Validators.required]),
      login: this.fb.nonNullable.control(p.login!, [Validators.email]),
      pwd: this.fb.nonNullable.control(p.pwd!, [Validators.required]),
      loginType: this.fb.nonNullable.control(p.loginType!, [Validators.required]),
    });
  }

  private formToOrg(): OrgModel {
    const formValue = this.profileForm.value;

    console.log(this.profileForm.controls.profiles.dirty);
    console.log(this.profileForm.controls.profiles);
    const org: OrgModel = {
      id: this.orgId ?? Guid.create().toString(),
      domain: '',
      description: '',
      name: formValue.name ?? '',
      administrator: {
        login: formValue.mainUser?.login!,
        pwd: formValue.mainUser?.pwd!
      },
      profiles: formValue.profiles?.map(formProfile => ({
        name: formProfile?.name!,
        login: formProfile?.login!,
        pwd: formProfile?.pwd!,
        loginType: formProfile!.loginType!
      }))!
    }

    return org;
  }
}

