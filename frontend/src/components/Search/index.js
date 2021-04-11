import React from "react";
import { message, Select, Avatar, Card } from "antd";
import { UserOutlined, UserAddOutlined } from "@ant-design/icons";
import {
  getAuthorByAuthorID,
  getAllAuthors,
  getAllRemoteAuthors,
} from "../../requests/requestAuthor";
import {
  createFollower,
  createRemoteFollower,
} from "../../requests/requestFollower";
import Meta from "antd/lib/card/Meta";
import {
  postRequest,
  postRemoteRequest,
} from "../../requests/requestFriendRequest";
import { domainAuthPair, remoteDomain } from "../../requests/URL";
import { getDomainName } from "../Utils";

const { Option } = Select;

export default class Search extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      authorID: this.props.authorID,
      authorList: [],
      remoteAuthorList: [],
      authorValue: undefined,
      authorGithub: undefined,
      objectID: undefined,
      cardVisible: false,
    };
  }

  componentDidMount() {
    this._isMounted = true;
    getAllAuthors().then((res) => {
      if (res.status === 200) {
        this.getAuthorDataSet(res.data).then((value) => {
          this.setState({ authorList: value });
        });
      } else {
        message.error("Request failed!");
      }
    });
    getAllRemoteAuthors({
      URL: `${remoteDomain}/author/`,
      auth: domainAuthPair[getDomainName(remoteDomain)],
    }).then((res) => {
      if (res.status === 200) {
        this.getAuthorDataSet(res.data).then((value) => {
          this.setState({ remoteAuthorList: value });
        });
      } else {
        message.error("Remote Request failed!");
      }
    });
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  hideDrawer = () => {
    this.setState({
      cardVisible: false,
    });
  };

  onSearchChange = (value) => {
    if (value !== undefined) {
      var authorInfo = value.split(",");
      this.setState({
        authorValue: authorInfo[0],
        authorGithub: authorInfo[1],
        objectID: authorInfo[2],
        cardVisible: true,
      });
    } else {
      this.setState({
        authorValue: undefined,
        authorGithub: undefined,
        objectID: undefined,
        cardVisible: false,
      });
    }
  };

  handleClickFollow = async () => {
    getAuthorByAuthorID({
      authorID: this.state.authorID,
    }).then((response1) => {
      var n = this.state.authorID.indexOf("/author/");
      var length = this.state.authorID.length;
      let params = {
        type: "follow",
        actor: {
          type: "author",
          id: response1.data.id,
          host: response1.data.host,
          displayName: response1.data.displayName,
          url: response1.data.url,
          github: response1.data.github,
        },
        object: this.state.objectID,
        summary: "I want to follow you!",
      };
      const domain = getDomainName(this.state.objectID);
      if (domain !== window.location.hostname) {
        params.URL = `${params.object.toString()}/inbox/`;
        params.auth = domainAuthPair[domain];
        params.remote = true;
        // change later
        let params1 = {
          URL:
            this.state.objectID + 
            "/followers/" +
            this.state.authorID.substring(n + 8, length) +
            "/",
          auth: domainAuthPair[domain],
          remote: true,
        };
        createRemoteFollower(params1).then((response) => {
          if (response.status === 204) {
            message.success("Remote: Successfully followed!");
            //window.location.reload();
          } else {
            message.error("Remote: Follow Failed!");
          }
        });
        postRemoteRequest(params).then((response) => {
          if (response.status === 200) {
            message.success("Remote: Request sent!");
          } else if (response.status === 409) {
            message.error("Remote: Invalid request!");
          } else {
            message.error("Remote: Request failed!");
          }
        });
      } else {
        let params1 = {
          actor: this.state.authorID.substring(n + 8, length),
          object: this.state.objectID,
        };
        createFollower(params1).then((response) => {
          if (response.status === 204) {
            message.success("Successfully followed!");
          } else {
            message.error("Follow Failed!");
          }
        });
        postRequest(params).then((response) => {
          if (response.status === 200) {
            message.success("Request sent!");
          } else if (response.status === 409) {
            message.error("Invalid request!");
          } else {
            message.error("Request failed!");
          }
        });

      }

    });

    
    
  };

  getAuthorDataSet = (authorData) => {
    let promise = new Promise(async (resolve, reject) => {
      const authorArray = [];
      for (const author of authorData) {
        authorArray.push({
          authorID: author.id,
          authorName: author.displayName,
          authorGithub: author.github,
        });
      }
      resolve(authorArray);
    });
    return promise;
  };

  render() {
    const { authorValue, authorGithub, cardVisible } = this.state;
    const allAuthors = this.state.authorList.concat(
      this.state.remoteAuthorList
    );
    const options = allAuthors.map((d) => (
      <Option key={[d.authorName, d.authorGithub, d.authorID]}>
        {d.authorName}
      </Option>
    ));

    const userCard = cardVisible ? (
      <Card
        style={{
          width: 400,
          marginTop: "64px",
          marginLeft: "auto",
          marginRight: "auto",
        }}
        cover={
          <img
            alt="coverImage"
            src="https://gw.alipayobjects.com/zos/rmsportal/JiqGstEfoWAOHiTxclqi.png"
          />
        }
        actions={[
          <UserAddOutlined key="edit" onClick={this.handleClickFollow} />,
        ]}
      >
        <Meta
          avatar={<Avatar icon={<UserOutlined />} />}
          title={authorValue}
          description={`Github: ${authorGithub}`}
        />
      </Card>
    ) : (
      ""
    );

    return (
      <div>
        <Select
          showSearch
          allowClear
          style={{ margin: "0 30%", width: "50%" }}
          placeholder="Search for a user"
          optionFilterProp="children"
          onChange={this.onSearchChange}
          filterOption={(input, option) =>
            option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
          }
        >
          {options}
        </Select>
        {userCard}
      </div>
    );
  }
}
