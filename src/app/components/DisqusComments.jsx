'use client';

import { DiscussionEmbed } from 'disqus-react';

const DisqusComments = ({ post }) => {
    const disqusShortname = process.env.NEXT_PUBLIC_DISQUS_SHORTNAME;
    
    // Ensure you have a post object and a shortname before rendering
    if (!disqusShortname || !post) {
        return <p className="text-sm text-center text-gray-500 py-8">Comments are currently unavailable.</p>;
    }

    const disqusConfig = {
        url: `${process.env.NEXT_PUBLIC_APP_URL}/blog/${post.slug}`,
        identifier: post.id.toString(),
        title: post.title,
    };

    return (
        <div className="mt-16">
            <DiscussionEmbed
                shortname={disqusShortname}
                config={disqusConfig}
            />
        </div>
    );
};

export default DisqusComments;
