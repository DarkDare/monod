import React from 'react';
import { mount, shallow, render } from 'enzyme';
import { expect } from 'chai';
import mdit from 'markdown-it';
import emojione from 'emojione';
import hljs from 'highlight.js';

// see: https://github.com/mochajs/mocha/issues/1847
const { before, describe, it, Promise } = global;

import Preview from '../Preview';


describe('<Preview />', () => {

  let previewLoader;

  before(() => {
    previewLoader = () => {

      return Promise.resolve({
        markdownIt: mdit,
        hljs: hljs,
        emojione: emojione
      })
    };
  });

  it('renders a block with preview css class', () => {
    const wrapper = shallow(
      <Preview raw={""} pos={0} template={''} />
    );

    expect(wrapper.find('.preview')).to.have.length(1);
  });

  it('renders a loading message', () => {
    const wrapper = render(<Preview raw={""} pos={0} template={''} />);

    expect(wrapper.text()).to.contain('Loading all the rendering stuff...');
  });

  it('renders content', (done) => {
    const wrapper = mount(
      <Preview
        raw={'foo'}
        pos={0}
        previewLoader={previewLoader}
        template={''}
      />
    );

    setTimeout(() => {
      expect(wrapper.html()).to.contain('foo');

      done();
    }, 5);
  });

  it('converts markdown into HTML', (done) => {
    const wrapper = mount(
      <Preview
        raw={'*italic*'}
        pos={0}
        previewLoader={previewLoader}
        template={''}
      />
    );

    setTimeout(() => {
      expect(wrapper.html()).to.contain('<em>italic</em>');

      done();
    }, 5);
  });

  it('converts markdown blocks into HTML chunks', (done) => {
    const wrapper = mount(
      <Preview
        raw={['*italic*', '**bold**'].join('\n\n')}
        pos={0}
        previewLoader={previewLoader}
        template={''}
      />
    );

    setTimeout(() => {
      expect(wrapper.html()).to.contain(
        '<div class="chunk"><span><p><em>italic</em></p>\n</span></div>'
      );

      expect(wrapper.html()).to.contain(
        '<div class="chunk"><span><p><strong>bold</strong></p>\n</span></div>'
      );

      done();
    }, 5);
  });

  it('converts Emoji', (done) => {
    const wrapper = mount(
      <Preview
        raw={":smile:"}
        pos={0}
        previewLoader={previewLoader}
        template={''}
      />
    );

    setTimeout(() => {
      expect(wrapper.html()).to.contain(
        '<span class="emojione emojione-1f604" title=":smile:">😄</span>'
      );

      done();
    }, 5);
  });

  it('highlights code blocks', (done) => {
    const wrapper = mount(
      <Preview
        raw={'```python\nprint()\n```'}
        pos={0}
        previewLoader={previewLoader}
        template={''}
      />
    );

    setTimeout(() => {
      expect(wrapper.html()).to.contain(
        [
          '<pre><code class="language-python">',
          '<span class="hljs-function">',
          '<span class="hljs-title">print</span>',
          '<span class="hljs-params">()</span>',
          '</span>',
          '\n',
          '</code></pre>'
        ].join('')
      );

      done();
    }, 5);
  });

  it('generates paragraph chunks', (done) => {
    let chunks;
    const wrapper = shallow(
      <Preview
        raw={''}
        pos={0}
        previewLoader={previewLoader}
        template={''}
      />
    );

    setTimeout(() => {
      const preview = wrapper.instance();

      chunks = preview.getChunks('foo', {});
      expect(chunks).to.have.lengthOf(1);
      expect(chunks[0]).to.have.lengthOf(3);

      chunks = preview.getChunks('foo\n\nbar', {});
      expect(chunks).to.have.lengthOf(2);

      expect(chunks[0][0]).to.have.property('type', 'paragraph_open');
      expect(chunks[0][1]).to.have.property('type', 'inline');
      expect(chunks[0][1]).to.have.property('content', 'foo');
      expect(chunks[0][2]).to.have.property('type', 'paragraph_close');

      expect(chunks[1][0]).to.have.property('type', 'paragraph_open');
      expect(chunks[1][1]).to.have.property('type', 'inline');
      expect(chunks[1][1]).to.have.property('content', 'bar');
      expect(chunks[1][2]).to.have.property('type', 'paragraph_close');
      done();
    }, 5);
  });

  it('generates code block chunks', (done) => {
    let chunks;
    const wrapper = shallow(
      <Preview
        raw={''}
        pos={0}
        previewLoader={previewLoader}
        template={''}
      />
    );

    setTimeout(() => {
      const preview = wrapper.instance();

      // A code block is one single chunk
      chunks = preview.getChunks('```python\nprint()\nfoo()\n```', {});
      expect(chunks).to.have.lengthOf(1);

      // A code block with empty rows is still one single chunk
      chunks = preview.getChunks('```python\nprint()\n\nfoo()\n```', {});
      expect(chunks).to.have.lengthOf(1);

      done();
    }, 5);
  });

  it('generates nested block chunks', (done) => {
    let chunks;
    const wrapper = shallow(
      <Preview
        raw={''}
        pos={0}
        previewLoader={previewLoader}
        template={''}
      />
    );

    setTimeout(() => {
      const preview = wrapper.instance();

      chunks = preview.getChunks('> this is **bold** content', {});
      expect(chunks).to.have.lengthOf(1);
      expect(chunks[0]).to.have.lengthOf(5);

      chunks = preview.getChunks('* foo\n* bar\n', {});
      expect(chunks).to.have.lengthOf(1);
      expect(chunks[0]).to.have.lengthOf(12);

      done();
    }, 5);
  });


  it('handles html block chunks', (done) => {
    let chunks;
    const wrapper = shallow(
      <Preview
        raw={''}
        pos={0}
        previewLoader={previewLoader}
        template={''}
      />
    );

    let html = [
      '<div class="foo">',
      '  <h3>sub-section</h3>',
      '  <p>lorem ipsum</p>',
      '</div>'
    ];

    setTimeout(() => {
      const preview = wrapper.instance();

      // raw html block
      chunks = preview.getChunks(html.join('\n'), {});
      expect(chunks).to.have.lengthOf(1);
      expect(chunks[0]).to.have.lengthOf(1);
      expect(chunks[0][0]).to.have.property('type', 'html_block');

      // Insert an empty row
      html.splice(2, 0, '\n');
      chunks = preview.getChunks(html.join('\n'), {});
      expect(chunks).to.have.lengthOf(2);
      expect(chunks[0]).to.have.lengthOf(1);
      expect(chunks[0][0]).to.have.property('type', 'html_block');
      expect(chunks[1][0]).to.have.property('type', 'html_block');

      done();
    }, 5);
  });

  it('sanitizes incomplete html blocks', (done) => {
    let chunks;
    const wrapper = shallow(
      <Preview
        raw={''}
        pos={0}
        previewLoader={previewLoader}
        template={''}
      />
    );

    setTimeout(() => {
      const preview = wrapper.instance();

      chunks = preview.getChunks('<div class="foo">', {});
      expect(chunks).to.have.lengthOf(1);
      expect(chunks[0]).to.have.lengthOf(1);
      expect(chunks[0][0]).to.have.property('type', 'html_block');
      expect(chunks[0][0]).to.have.property('content', '<div></div>');

      chunks = preview.getChunks('</div>', {});
      expect(chunks).to.have.lengthOf(1);
      expect(chunks[0]).to.have.lengthOf(1);
      expect(chunks[0][0]).to.have.property('type', 'html_block');
      expect(chunks[0][0]).to.have.property('content', '');

      done();
    }, 5);
  });

  it('removes front-matter YAML header from preview', (done) => {
    const wrapper = mount(
      <Preview
        raw={'---\ntoto: 1\n---\n*italic*'}
        pos={0}
        previewLoader={previewLoader}
        template={''}
      />
    );

    setTimeout(() => {
      expect(wrapper.html()).to.contain('<em>italic</em>');

      done();
    }, 5);
  });

  it('stores front-matter (YAML) values', (done) => {
    const wrapper = mount(
      <Preview
        raw={'---\ntoto: 1\n---\n*italic*'}
        pos={0}
        previewLoader={previewLoader}
        template={''}
      />
    );

    setTimeout(() => {
      const preview = wrapper.instance();
      expect(preview.matter).to.have.property('content', '*italic*');
      expect(preview.matter).to.have.property('data');
      expect(preview.matter.data).to.deep.equal({toto:1});

      done();
    }, 5);
  });

  it('compiles a template given a context', (done) => {
    const wrapper = mount(
      <Preview
        raw={'---\nlocation: Foo\nsignature: John Doe\n---\nThis is content'}
        template={'letter'}
        pos={0}
        previewLoader={previewLoader}
      />
    );

    setTimeout(() => {
      const html = wrapper.html();

      expect(html).to.contain('<span>Foo</span>');
      expect(html).to.contain('<div>John Doe</div>');
      expect(html).to.contain([
          '<div class="chunk">',
          '<span>',
          '<p>',
          'This is content',
          '</p>\n',
          '</span>',
          '</div>',
        ].join(''));

      done();
    }, 5);
  });

  it('does not add context without template', (done) => {
    const wrapper = mount(
      <Preview
        raw={'---\ntitle: Foo\nauthor: John Doe\n---\nThis is content'}
        template={''}
        pos={0}
        previewLoader={previewLoader}
      />
    );

    setTimeout(() => {
      const html = wrapper.html();

      expect(html).not.to.contain('Foo</h1>');
      expect(html).not.to.contain('John Doe</div>');
      expect(html).to.contain([
          '<div class="chunk">',
          '<span>',
          '<p>',
          'This is content',
          '</p>\n',
          '</span>',
          '</div>',
        ].join(''));

      done();
    }, 5);
  });
});
