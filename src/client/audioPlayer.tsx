import * as React from 'react';
import * as WavDecoder from 'wav-decoder';
import './audioPlayer.css';

interface IProps {
    audio: string;
}

interface IState {
    isPlaying: boolean;
    mimeType: null | string;
    ac: null | AudioContext;
    ab: null | AudioBuffer;
    duration: number;
    current_second: number;
}

export class AudioPlayer extends React.Component<IProps, IState> {
    timer: undefined | NodeJS.Timeout;
    source: undefined | AudioBufferSourceNode;
    constructor(props: IProps) {
        super(props);
        let extracted_track = null;
        let mimeType = null;
        if (this.props.audio.startsWith('data:')) {
            mimeType = this.props.audio.split(';')[0].split(':')[1];
            if (mimeType == 'audio/wav' || mimeType == 'audio/x-wav') {
                const raw = window.atob(this.props.audio.split(';base64,')[1]);
                const rawLength = raw.length;
                const array = new Uint8Array(new ArrayBuffer(rawLength));

                for (let i = 0; i < rawLength; i++) {
                    array[i] = raw.charCodeAt(i);
                }
                extracted_track = array.buffer;
                extracted_track = WavDecoder.decode.sync(extracted_track);

                const ac = new AudioContext({ sampleRate: extracted_track.sampleRate });
                const ab = ac.createBuffer(
                    extracted_track.numberOfChannels,
                    extracted_track.length,
                    extracted_track.sampleRate
                );
                for (let ch = 0; ch < ab.numberOfChannels; ch++) {
                    const f32a = new Float32Array(ab.length);
                    for (let i = 0; i < ab.length; i++) {
                        f32a[i] = extracted_track.channelData[ch][i];
                    }
                    ab.copyToChannel(f32a, ch);
                }
                this.state = {
                    ab: ab,
                    ac: ac,
                    isPlaying: false,
                    mimeType: mimeType,
                    duration: extracted_track.length / extracted_track.sampleRate,
                    current_second: 0
                };
            } else {
                this.state = {
                    ac: null,
                    ab: null,
                    isPlaying: false,
                    mimeType: mimeType,
                    duration: 0,
                    current_second: 0
                };
            }
        } else {
            this.state = {
                ac: null,
                ab: null,
                isPlaying: false,
                mimeType: mimeType,
                duration: 0,
                current_second: 0
            };
        }
    }
    public render() {
        if (this.state.mimeType == null) {
            return <div>Could not read audiotrack.</div>;
        } else if (!(this.state.mimeType == 'audio/wav' || this.state.mimeType == 'audio/x-wav')) {
            return <div>MIME type "{this.state.mimeType}" is not supported.</div>;
        }
        return (
            <div className="audioplayer">
                <button className="playButton" onClick={this.onPlayButtonClick.bind(this)}>
                    {this.state.isPlaying ? 'Pause' : 'Play'}
                </button>
                <input
                    type="range"
                    className="seek-bar"
                    value={this.state.current_second}
                    min={0}
                    max={this.state.duration}
                    step={0.5}
                    onChange={this.onSliderChange.bind(this)}
                />
                <div className="time">
                    {this.formatToMinutes(this.state.current_second)} / {this.formatToMinutes(this.state.duration)}
                </div>
            </div>
        );
    }

    private onSliderChange(event: any) {
        this.setState({ current_second: Number.parseFloat(event.target.value) });
        if (this.state.isPlaying) {
            this.stop();
            this.start();
        }
    }

    private formatToMinutes(seconds: number): string {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.round(seconds - minutes * 60);

        return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
    }

    private start() {
        if (this.state.ac != null) {
            this.source = this.state.ac.createBufferSource();
            this.source.buffer = this.state.ab;
            this.source.connect(this.state.ac.destination);
            this.source.start(this.state.ac.currentTime, this.state.current_second);
            this.timer = setInterval(() => {
                this.setState({
                    current_second: this.state.current_second + 0.5
                });
                if (this.state.current_second > this.state.duration) {
                    this.setState({
                        current_second: 0
                    });
                    this.stop();
                    this.source?.disconnect();
                }
            }, 500);
            this.setState({
                isPlaying: true
            });
        }
    }

    private stop(): void {
        if (this.timer != undefined) {
            clearInterval(this.timer);
            this.source?.stop();
        }
        this.setState({
            isPlaying: false
        });
    }
    private onPlayButtonClick() {
        if (this.state.isPlaying) {
            this.stop();
        } else {
            this.start();
        }
    }
}
