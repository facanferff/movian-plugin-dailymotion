import api = require('./api');
import general = require('./general');
import { log } from './log';
import playback = require('./playback');

interface ModelPagination {
    hasNext: boolean;
    next: () => void;
}

interface ModelCallbackResultSuccess {
    type: ModelCallbackResultType.SUCCESS;
    json: any;
    pagination: ModelPagination;
}

interface ModelCallbackResultError {
    type: ModelCallbackResultType.ERROR;
    message: string;
}

type ModelCallbackResult = ModelCallbackResultSuccess | ModelCallbackResultError;

export enum ModelCallbackResultType {
    SUCCESS = 0,
    ERROR = 1
}

export interface ModelCallback {
    onSuccess(result: ModelCallbackResultSuccess);
    onError?(error: ModelCallbackResultError);
}


export function getChannels(filters: api.VideoFilters, config, callback: ModelCallback) {
    api.call("/channels", getChannelFields(), filters, config, apiCallback(getChannels, callback));
}

export function getChannelTopUsers(channelId: string, filters: api.BaseFilters, config, callback: ModelCallback) {
    config.disableCache = true;
    api.call("/channel/" + channelId + "/users", getUserFields(), filters, config, apiCallback(getChannelTopUsers.bind(null, channelId), callback));
}

export function getChannelVideos(channelId: string, filters: api.VideoFilters, config, callback: ModelCallback) {
    api.call("/channel/" + channelId + "/videos", getVideoFields(), filters, config, apiCallback(getChannelVideos.bind(null, channelId), callback));
}

export function getVideoPlaybackData(type: string, videoId: string): VideoParams {
    var html = playback.getVideoEmbedPage(videoId);

    return {
        title: playback.getVideoTitle(html),
        sources: playback.getVideoSources(html),
        subtitles: playback.getVideoSubtitles(html),
        icon: playback.getVideoCover(html),
        no_fs_scan: true,
        no_subtitle_scan: true,
        canonicalUrl: general.PREFIX + ":video:" + type + ":" + videoId
    };
}

export function searchVideos(filters: api.VideoFilters, config, callback: ModelCallback) {
    api.call("/videos", getVideoFields(), filters, config, apiCallback(searchVideos, callback));
}

export function getAvailableVideoSorts(issearch: boolean): MultiOptOption[] {
    var sorts: MultiOptOption[] = [
        ['recent', 'Most Recent', true],
        ['visited', 'Most Visited'],
        ['commented', 'Most Commented'],
        ['trending', 'Most Trending']
    ];

    if (issearch)
        sorts.push(['relevance', 'Relevance']);

    return sorts;
}

function apiCallback(model: Function, callback: ModelCallback) {
    return {
        onSuccess: function (result: api.ApiCallbackResultSuccess) {
            callback.onSuccess({
                type: ModelCallbackResultType.SUCCESS,
                json: result.json,
                pagination: createPaginationObject(model, result.json)
            });
        },

        onError: function (error: api.ApiCallbackResultError) {
            callback.onError({
                type: ModelCallbackResultType.ERROR,
                message: error.message
            });
        }
    };
}

function createPaginationObject(model: Function, json) {
    var pagination = {
        hasNext: json.has_more,
        next: null
    };

    if (json.has_more) {
        pagination.next = model.bind(null, json.page + 1);
    }

    return pagination;
}

function getChannelFields() {
    return [
        'id',
        'item_type',
        'name'
    ];
}

function getUserFields() {
    return [
        'avatar_360_url',
        'id',
        'item_type',
        'screenname'
    ];
}

function getVideoFields() {
    return [
        'description',
        'duration',
        'id',
        'item_type',
        'mode',
        'owner',
        'thumbnail_480_url',
        'title',
        'views_total'
    ];
}