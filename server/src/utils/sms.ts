/**
 * 真实短信验证码发送模块
 * 需要安装: pnpm add @alicloud/dysmsapi20170525
 * 
 * 配置环境变量:
 * ALIBABA_CLOUD_ACCESS_KEY_ID=你的AccessKeyId
 * ALIBABA_CLOUD_ACCESS_KEY_SECRET=你的AccessKeySecret
 * ALIBABA_CLOUD_SMS_SIGN_NAME=你的签名
 * ALIBABA_CLOUD_SMS_TEMPLATE_CODE=你的模板ID
 */

import Dysmsapi, * as DysmsapiTypes from '@alicloud/dysmsapi20170525';
import * as OpenApi from '@alicloud/openapi-client';
import * as Util from '@alicloud/tea-util';

// 创建短信客户端
function createSmsClient(): Dysmsapi {
  const config = new OpenApi.Config({
    accessKeyId: process.env.ALIBABA_CLOUD_ACCESS_KEY_ID || '',
    accessKeySecret: process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET || '',
  });
  config.endpoint = 'dysmsapi.aliyuncs.com';
  return new Dysmsapi(config);
}

/**
 * 发送短信验证码
 * @param phone 手机号
 * @param code 验证码
 */
export async function sendSmsCode(phone: string, code: string): Promise<boolean> {
  try {
    const client = createSmsClient();
    
    const sendRequest = new DysmsapiTypes.SendSmsRequest({
      phoneNumbers: phone,
      signName: process.env.ALIBABA_CLOUD_SMS_SIGN_NAME,
      templateCode: process.env.ALIBABA_CLOUD_SMS_TEMPLATE_CODE,
      templateParam: JSON.stringify({ code }),
    });

    const runtime = new Util.RuntimeOptions({});
    const result = await client.sendSmsWithOptions(sendRequest, runtime);
    
    // BizId 为空表示发送失败
    if (!result.body?.bizId) {
      console.error('短信发送失败:', result.body);
      return false;
    }
    
    console.log(`短信发送成功: ${phone}, bizId: ${result.body.bizId}`);
    return true;
  } catch (error) {
    console.error('短信发送异常:', error);
    return false;
  }
}
