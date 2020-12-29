const { Translate } = require('@google-cloud/translate').v2;

// Creates a client
const translateClient = new Translate();

export async function googleTranslate(text: string | string[]): Promise<string | string[]> {
  // Result of ".translate()" method is always array
  // 0-index element - is translated parameter "text"
  // if "text" is string - 0-index element is string
  // if "text" is array - 0-index element is array
  const [result] = await translateClient.translate(text, { from: 'ru', to: 'uk', model: 'nmt', format: 'html' });

  return result;
}
