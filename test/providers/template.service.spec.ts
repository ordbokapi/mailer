import {
  TemplateService,
  TemplateName,
} from '../../src/providers/template.service';

describe('TemplateService', () => {
  let service: TemplateService;

  beforeAll(() => {
    service = new TemplateService();
  });

  it('should render verification template', () => {
    const [html, text] = service.render(TemplateName.Verification, {
      verificationUrl: 'https://example.com/verify',
    });

    expect(html).toContain('https://example.com/verify');
    expect(text).toContain('https://example.com/verify');
  });

  it('should render signed up template', () => {
    const [html, text] = service.render(TemplateName.SignedUp, {
      unsubscribeUrl: 'https://example.com/unsub',
    });

    expect(html).toContain('https://example.com/unsub');
    expect(text).toContain('https://example.com/unsub');
  });

  it('should render new post template', () => {
    const data = {
      title: 'Title',
      url: 'https://example.com',
      summary: 'Summary',
      unsubscribeUrl: 'https://example.com/unsub',
    };
    const [html, text] = service.render(TemplateName.NewPost, data);

    expect(html).toContain(data.title);
    expect(html).toContain(data.url);
    expect(html).toContain(data.summary);
    expect(text).toContain(data.title);
    expect(text).toContain(data.url);
    expect(text).toContain(data.summary);
  });
});
