import React from "react";
import { List, message, Avatar, Spin } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { getRequest } from "../../requests/requestFriendRequest";
import {
  getAuthorByAuthorID,
  getRemoteAuthorByAuthorID,
} from "../../requests/requestAuthor";
import SingleRequest from "../SingleRequest";
import { domainAuthPair } from "../../requests/URL";
import { generateRandomAvatar, getDomainName } from "../Utils";

export default class InboxRequest extends React.Component {
  constructor(props) {
    super(props);
    this._isMounted = false;
    this.state = {
      requestDataSet: [],
      authorID: this.props.authorID,
      loading: true,
    };
  }

  componentDidMount() {
    this._isMounted = true;
    getRequest({
      authorID: this.state.authorID,
    }).then((res) => {
      if (res.status === 200) {
        this.getRequestDataSet(res.data).then((value) => {
          this.setState({ requestDataSet: value, loading: false });
        });
      } else {
        message.error("Fail to get my requests.");
      }
    });
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  getRequestDataSet = (requestData) => {
    let promise = new Promise(async (resolve, reject) => {
      const requestSet = [];
      for (const element of requestData) {
        const domain = getDomainName(element.actor);
        if (domain !== window.location.hostname) {
          const res = await getRemoteAuthorByAuthorID({
            URL: element.actor,
            auth: domainAuthPair[domain],
          });
          requestSet.push({
            actorName: res.data.displayName,
            actorID: element.actor,
            remote: true,
          });
        } else {
          const res = await getAuthorByAuthorID({
            authorID: element.actor,
          });
          requestSet.push({
            actorName: res.data.displayName,
            actorID: element.actor,
            remote: false,
          });
        }
      }
      resolve(requestSet);
    });

    return promise;
  };

  render() {
    const { requestDataSet, loading } = this.state;

    return (
      <div style={{ margin: "0 20%" }}>
        {loading ? (
          <div style={{ textAlign: "center", marginTop: "20%" }}>
            <Spin size="large" /> Loading...
          </div>
        ) : (
          <List
            bordered
            itemLayout="horizontal"
            dataSource={requestDataSet}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  avatar={<Avatar src={generateRandomAvatar(item.actorName)} />}
                  title={item.actorName}
                  description=" wants to follow you."
                />
                <SingleRequest
                  authorID={this.state.authorID}
                  actorID={item.actorID}
                  remote={item.remote}
                />
              </List.Item>
            )}
          />
        )}
      </div>
    );
  }
}
