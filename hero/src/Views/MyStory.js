import React from 'react';
import './MyStory.css';

const MyStory = () => {
  return (
    <div className="story-container">
      <div className="story-header">
        <h1>Meet Jeremy LaFaver</h1>
      </div>

      <div className="story-content">
        <section className="intro-section">
          <h2>My name is Jeremy LaFaver and this is my blog.</h2>
          <p>I started this blog as a side project back in 2022 and it quickly became one of the fastest-growing businesses I ever created.</p>
          <p>However, it was a long road to get where I am today.</p>
          <p>Throughout my entrepreneurial journey, I've been bitten by the online business bug more times than I can count.</p>
          <p>But let me tell you, perfectionism and self-doubt?</p>
          <p>They were my kryptonite.</p>
          <p>Every time I'd start a new venture, these sneaky villains would creep in, whispering doubts and demanding impossible standards.</p>
          <p>Before I knew it, I'd be throwing in the towel, convinced I wasn't cut out for this whole digital entrepreneur thing.</p>
          <p>It was like being on a rollercoaster of excitement and disappointment.</p>
          <p>I'd get fired up about a new idea, dive in headfirst, and then... bam!</p>
        </section>

        <section className="journey-section">
          <h2>Here's how it went:</h2>
          <p>I bellyflop into new projects, obsessively plotting every detail from behind my screen.</p>
          <p>Hours fly by as I immerse myself in the minutiae of branding, agonize over web designs, and tinker endlessly with logo concepts.</p>
          <p>I meticulously craft forms, set up countless social media profiles, and don't even get me started on the rabbit hole of creating LLCs and navigating the maze of business banking.</p>
          <p>It's like I'm building a digital empire before I've even left my bedroom!</p>
        </section>

        <section className="early-life">
          <h2>1982: From Nothing at All to a Real, Living Human Baby</h2>
          <p>I was born on October 21, 1982, at the University of Utah Hospital in Salt Lake City, Utah.</p>
          <p>Eager to hit the ground running in the 1980s, I was the second-born son to my amazing parents, Terry and Cindy.</p>
          <p>We lived in a small house in Kearns, Utah, about 5-10 miles outside of Salt Lake City.</p>
          {/* Continue with early life story */}
        </section>

        <section className="present-day">
          <h2>Where I Am Today</h2>
          <p>Today, I am a married man to the love of my life, and she has shown me support from another human that I never even knew existed.</p>
          <p>I teach the complex world of AI, Blogging, and online Entrepreneurship.</p>
          <p>I've seen the internet grow from its humble beginnings to the powerhouse it is today, and I've kept pace every step of the way.</p>
          <p>My mission is to share the knowledge I've gained with the next generation of digital entrepreneurs, helping them to scale their businesses quickly and effectively.</p>
        </section>

        <section className="thank-you">
          <h2>I Want to Take a Moment and Thank You For Being Here.</h2>
          <p>If you made it this far, I appreciate the time you took to read this and deeply value every relationship I make from this blog.</p>
          <p>I'm here for you as both a blogging guide and as a friend. I try to respond to every message or email and want to hear your story – both the good and the bad.</p>
          <p>Here, fresh voices unite to spark creativity, share wisdom, and amplify each other's success.</p>
          <p>As newcomers to this digital frontier, we're stronger together.</p>
          <p>Our community is built on collaboration, mutual support, and smart strategies.</p>
          <p>Join me in lifting each other up, celebrating milestones, and navigating the exciting world of blogging as a team.</p>
          <p>Together, we'll turn our passion into thriving online presences.</p>
          <p>Thank you for reading.</p>
        </section>

        <section className="workshop-cta">
          <h2>Join Our Blog Monetization Workshop</h2>
          <p>Discover the secrets of making money from home through our blog monetization workshop. Uncover expert strategies and proven tactics to boost your blog's revenue. Our workshop is designed to equip you with the knowledge and tools needed to turn your passion for blogging into a lucrative venture.</p>
          <button className="cta-button">Reserve Your Spot</button>
        </section>

        <section className="contact-form">
          <h2>Let's Connect</h2>
          <form className="connect-form">
            <div className="form-group">
              <input type="text" placeholder="First Name" />
              <input type="text" placeholder="Last Name" />
            </div>
            <div className="form-group">
              <input type="email" placeholder="Email" />
              <input type="tel" placeholder="Phone" />
            </div>
            <button type="submit">Submit</button>
          </form>
        </section>
      </div>
    </div>
  );
};

export default MyStory; 