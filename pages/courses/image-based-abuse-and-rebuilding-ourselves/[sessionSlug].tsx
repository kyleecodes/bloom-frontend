import {
  ISbStoriesParams,
  ISbStoryData,
  getStoryblokApi,
  useStoryblokState,
} from '@storyblok/react';
import { GetStaticPathsContext, GetStaticPropsContext, NextPage } from 'next';
import NoDataAvailable from '../../../components/common/NoDataAvailable';
import StoryblokSessionIbaPage, {
  StoryblokSessionIbaPageProps,
} from '../../../components/storyblok/StoryblokSessionIbaPage';
import { getStoryblokPageProps } from '../../../utils/getStoryblokPageProps';

interface Props {
  story: ISbStoryData | null;
}

const SessionDetail: NextPage<Props> = ({ story }) => {
  story = useStoryblokState(story);

  if (!story) {
    return <NoDataAvailable />;
  }

  return (
    <StoryblokSessionIbaPage
      {...(story.content as StoryblokSessionIbaPageProps)}
      storyId={story.id}
      storyUuid={story.uuid}
      storyPosition={story.position}
    />
  );
};

export async function getStaticProps({ locale, preview = false, params }: GetStaticPropsContext) {
  let sessionSlug =
    params?.sessionSlug instanceof Array ? params.sessionSlug.join('/') : params?.sessionSlug;
  const fullSlug = `courses/image-based-abuse-and-rebuilding-ourselves/${sessionSlug}`;

  const storyblokProps = await getStoryblokPageProps(fullSlug, locale, preview, {
    resolve_relations: 'session_iba.course',
  });

  return {
    props: {
      ...storyblokProps,
      messages: {
        ...require(`../../../messages/shared/${locale}.json`),
        ...require(`../../../messages/navigation/${locale}.json`),
        ...require(`../../../messages/courses/${locale}.json`),
      },
    },

    revalidate: 3600, // revalidate every hour
  };
}

export async function getStaticPaths({ locales }: GetStaticPathsContext) {
  let sbParams: ISbStoriesParams = {
    published: true,
    starts_with: 'courses/image-based-abuse-and-rebuilding-ourselves/',
  };

  const storyblokApi = getStoryblokApi();
  let sessions = await storyblokApi.getAll('cdn/links', sbParams);

  let paths: any = [];

  sessions.forEach((session: Partial<ISbStoryData>) => {
    const slug = session.slug;
    if (!slug) return;

    if (session.is_startpage || session.is_folder) {
      return;
    }

    // get array for slug because of catch all
    let splittedSlug = slug.split('/');

    if (locales) {
      // create additional languages
      for (const locale of locales) {
        paths.push({ params: { slug: splittedSlug[1], sessionSlug: splittedSlug[2] }, locale });
      }
    }
  });

  return {
    paths: paths,
    fallback: false,
  };
}

export default SessionDetail;
