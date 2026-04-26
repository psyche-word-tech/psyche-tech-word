/**
 * 阿里云号码认证服务 - 短信验证码发送模块
 * 需要安装: pnpm add @alicloud/dypnsapi20170525
 *
 * 配置环境变量:
 * ALIBABA_CLOUD_ACCESS_KEY_ID=你的AccessKeyId
 * ALIBABA_CLOUD_ACCESS_KEY_SECRET=你的AccessKeySecret
 * ALIBABA_CLOUD_SMS_SIGN_NAME=你的签名
 * ALIBABA_CLOUD_SMS_TEMPLATE_CODE=你的模板ID
 */

import DypnsapiModule, * as DypnsapiTypes from '@alicloud/dypnsapi20170525';
import * as Util from '@alicloud/tea-util';

const DypnsapiClient = (DypnsapiModule as any).default as typeof DypnsapiModule;

/**
 * 发送短信验证码（号码认证服务）
 * 该 API 会自动生成验证码并发送短信，返回生成的验证码
 * @param phone 手机号
 * @returns 成功时返回 { success: true, code: string }，失败时返回 { success: false, error: string }
 */
export async function sendSmsCode(phone: string): Promise<{ success: boolean; code?: string; error?: string }> {
  try {
    const client = new (DypnsapiClient as any)({
      accessKeyId: process.env.ALIBABA_CLOUD_ACCESS_KEY_ID || '',
      accessKeySecret: process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET || '',
    });

    const sendRequest = new DypnsapiTypes.SendSmsVerifyCodeRequest({
      phoneNumber: phone,
      signName: process.env.ALIBABA_CLOUD_SMS_SIGN_NAME,
      templateCode: process.env.ALIBABA_CLOUD_SMS_TEMPLATE_CODE,
      templateParam: JSON.stringify({ code: '##code##' }),
      returnVerifyCode: true,
      codeLength: 6,
      codeType: 1, // 仅数字
    });

    const runtime = new Util.RuntimeOptions({});
    const result = await client.sendSmsVerifyCodeWithOptions(sendRequest, runtime);

    // 检查响应码
    if (result.body?.code !== 'OK') {
      console.error('短信发送失败:', result.body?.code, result.body?.message);
      console.error('完整响应:', JSON.stringify(result.body));
      return { success: false, error: result.body?.message || '短信发送失败' };
    }

    const verifyCode = result.body?.model?.verifyCode;
    if (!verifyCode) {
      console.error('短信发送成功但未返回验证码');
      return { success: false, error: '未获取到验证码' };
    }

    console.log(`短信发送成功: ${phone}, bizId: ${result.body.model?.bizId}`);
    return { success: true, code: verifyCode };
  } catch (error: any) {
    console.error('短信发送异常:', error);
    return { success: false, error: error.message || '短信发送异常' };
  }
}
