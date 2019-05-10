import { SettingsService, _HttpClient } from '@delon/theme';
import { Component, OnDestroy, Inject, Optional } from '@angular/core';
import { Router } from '@angular/router';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { NzMessageService, NzModalService } from 'ng-zorro-antd';
import {
  SocialService,
  SocialOpenType,
  TokenService,
  DA_SERVICE_TOKEN,
} from '@delon/auth';
import { ReuseTabService } from '@delon/abc';
import { environment } from '@env/environment';
import { StartupService } from '@core/startup/startup.service';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { I18nNzMessageService } from 'app/service/i18n-nz-message.service';

@Component({
  selector: 'passport-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.less'],
  providers: [SocialService],
})
export class UserLoginComponent implements OnDestroy {

  constructor(
    fb: FormBuilder,
    private router: Router,
    // public msg: NzMessageService,
    public msg: I18nNzMessageService,
    private modalSrv: NzModalService,
    private settingsService: SettingsService,
    private socialService: SocialService,
    @Optional()
    @Inject(ReuseTabService)
    private reuseTabService: ReuseTabService,
    @Inject(DA_SERVICE_TOKEN) private tokenService: TokenService,
    private startupSrv: StartupService,
    private http: _HttpClient,
  ) {
    this.form = fb.group({
      userName: [null, [Validators.required, Validators.minLength(5)]],
      password: [null, Validators.required],
      mobile: [null, [Validators.required, Validators.pattern(/^1\d{10}$/)]],
      captcha: [null, [Validators.required]],
      remember: [true],
    });
    modalSrv.closeAll();
  }

  // region: fields

  get userName() {
    return this.form.controls.userName;
  }
  get password() {
    return this.form.controls.password;
  }
  get mobile() {
    return this.form.controls.mobile;
  }
  get captcha() {
    return this.form.controls.captcha;
  }
  get remember() {
    return this.form.controls.remember;
  }
  form: FormGroup;
  error = '';
  type = 0;
  loading = false;

  // region: get captcha

  count = 0;
  interval$: any;

  // endregion

  switch(ret: any) {
    this.type = ret.index;
  }

  getCaptcha() {
    this.count = 59;
    this.interval$ = setInterval(() => {
      this.count -= 1;
      if (this.count <= 0) clearInterval(this.interval$);
    }, 1000);
  }

  // endregion

  submit() {
    this.error = '';
    if (this.type === 0) {
      this.userName.markAsDirty();
      this.userName.updateValueAndValidity();
      this.password.markAsDirty();
      this.password.updateValueAndValidity();
      if (this.userName.invalid || this.password.invalid) return;
    } else {
      this.mobile.markAsDirty();
      this.mobile.updateValueAndValidity();
      this.captcha.markAsDirty();
      this.captcha.updateValueAndValidity();
      if (this.mobile.invalid || this.captcha.invalid) return;
    }

    this.loading = true;

    this.tokenService.clear();
    this.http.post('/api/authenticate',
    {
      username: this.userName.value,
      password: this.password.value,
      remember: this.remember.value
    }).subscribe(resp => {
      console.log(resp);

      this.loading = false;

      // 清空路由复用信息
      this.reuseTabService.clear();
      // 设置Token信息
      this.tokenService.set({
        token: resp['id_token'],
        name: this.userName.value,
        email: `cipchk@qq.com`,
        id: 10000,
        time: + new Date(),
      });
      // 重新获取 StartupService 内容，若其包括 User 有关的信息的话
      // this.startupSrv.load().then(() => this.router.navigate(['/']));
      // 否则直接跳转
      this.router.navigate(['/']);

    });
    console.log(this.settingsService.app);
  }


  ngOnDestroy(): void {
    if (this.interval$) clearInterval(this.interval$);
  }
}
